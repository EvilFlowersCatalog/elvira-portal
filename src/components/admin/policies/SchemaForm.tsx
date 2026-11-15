import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../../primitives/Select';
import { Switch, TextInput } from '../Field';
import { IJsonSchema } from '../../../utils/interfaces/contentPolicy';

/**
 * A form rendered from a JSON Schema (elvira-portal#47): the content-policy editor and typed settings both use it,
 * so no field is written by hand per key. It covers what the policy schema needs — objects, enums (`$ref`'d tier
 * lists included), booleans, numbers, strings, arrays of enums — and falls back to a JSON box for anything else
 * (e.g. a `oneOf` of a tier and an object), so an unexpected schema never blocks editing.
 */

const SELECT_TRIGGER = 'h-9 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40';

/** Follows a local `$ref` (`#/$defs/x`, `#/definitions/x`) against the root schema; other refs are left alone. */
const resolveSchema =(schema: IJsonSchema | undefined, root: IJsonSchema): IJsonSchema => {
  let current = schema ?? {};
  for (let hops = 0; current.$ref && hops < 10; hops++) {
    const match = current.$ref.match(/^#\/(\$defs|definitions)\/(.+)$/);
    const target = match ? (match[1] === '$defs' ? root.$defs : root.definitions)?.[match[2]] : undefined;
    if (!target) break;
    const { $ref: _ref, ...rest } = current;
    current = { ...target, ...rest };
  }
  return current;
};

const typeOf = (schema: IJsonSchema) =>
  Array.isArray(schema.type) ? schema.type.find((t) => t !== 'null') : schema.type;

/** Every allowed primitive value of a schema, when it is a closed list (`enum`, or a `oneOf` of consts / enums). */
const choicesOf = (schema: IJsonSchema, root: IJsonSchema): unknown[] | null => {
  if (schema.enum) return schema.enum;
  const options = schema.oneOf ?? schema.anyOf;
  if (!options) return null;
  const values: unknown[] = [];
  for (const option of options.map((o) => resolveSchema(o, root))) {
    if ('const' in option) values.push(option.const);
    else if (option.enum) values.push(...option.enum);
    else return null;
  }
  return values;
};

const show = (value: unknown) => (value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value));

const humanize = (key: string) => key.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function JsonBox({ value, onChange, id, invalidLabel }: { value: unknown; onChange: (v: unknown) => void; id: string; invalidLabel: string }) {
  const [text, setText] = useState(() => (value === undefined ? '' : JSON.stringify(value, null, 2)));
  const [invalid, setInvalid] = useState(false);
  // What this box last sent up: that value coming back must not reformat the text being typed.
  const emitted = useRef<string | null>(null);
  // A new value from outside (another version, a reset) replaces the draft.
  useEffect(() => {
    const incoming = JSON.stringify(value ?? null);
    if (incoming === emitted.current) return;
    setText(value === undefined ? '' : JSON.stringify(value, null, 2));
    setInvalid(false);
  }, [value]);
  const emit = (next: unknown) => {
    emitted.current = JSON.stringify(next ?? null);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-1">
      <textarea
        id={id}
        value={text}
        spellCheck={false}
        rows={Math.min(12, Math.max(2, text.split('\n').length))}
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value.trim()) {
            setInvalid(false);
            emit(undefined);
            return;
          }
          try {
            const parsed = JSON.parse(e.target.value);
            setInvalid(false);
            emit(parsed);
          } catch {
            setInvalid(true);
          }
        }}
        className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-xs text-zinc-800 outline-none dark:bg-zinc-900/40 dark:text-zinc-100 ${
          invalid ? 'border-redText dark:border-red' : 'border-zinc-300 focus:border-primary dark:border-zinc-600'
        }`}
      />
      {invalid ? <p className="text-xs text-redText dark:text-red">{invalidLabel}</p> : null}
    </div>
  );
}

interface FieldProps {
  schema: IJsonSchema;
  root: IJsonSchema;
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  required?: boolean;
  depth?: number;
  disabled?: boolean;
  /** Top-level properties edited elsewhere (a policy's `key` and `title`). */
  hidden?: string[];
}

export function SchemaField({ schema: raw, root, name, value, onChange, required, depth = 0, disabled, hidden }: FieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const schema = resolveSchema(raw, root);
  const label = schema.title || humanize(name);
  const type = typeOf(schema);
  const choices = choicesOf(schema, root);
  const hint = [
    schema.description,
    schema.default !== undefined ? t('administration.policies.form.default', { value: show(schema.default) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  if (type === 'object' || (!type && schema.properties)) {
    const object = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
    const properties = schema.properties ?? {};
    const keys = Object.keys(properties).filter((key) => depth > 0 || !hidden?.includes(key));
    if (!keys.length) {
      return (
        <Labelled id={id} label={label} hint={hint} required={required}>
          <JsonBox id={id} value={value} onChange={onChange} invalidLabel={t('administration.policies.form.invalidJson')} />
        </Labelled>
      );
    }
    return (
      <fieldset
        className={
          depth === 0
            ? 'flex flex-col gap-4'
            : 'flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700'
        }
      >
        {depth > 0 ? (
          <legend className="px-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</legend>
        ) : null}
        {depth > 0 && schema.description ? (
          <p className="-mt-1 text-xs text-zinc-500 dark:text-zinc-400">{schema.description}</p>
        ) : null}
        {keys.map((key) => (
          <SchemaField
            key={key}
            schema={properties[key]}
            root={root}
            name={key}
            value={object[key]}
            required={schema.required?.includes(key)}
            depth={depth + 1}
            disabled={disabled}
            onChange={(next) => {
              // Keys the schema doesn't list are kept as they are.
              const copy = { ...object };
              if (next === undefined) delete copy[key];
              else copy[key] = next;
              onChange(copy);
            }}
          />
        ))}
      </fieldset>
    );
  }

  if (choices) {
    const options = choices.map((c) => ({ value: show(c), label: show(c) }));
    return (
      <Labelled id={id} label={label} hint={hint} required={required}>
        <Select
          id={id}
          value={value === undefined ? '' : show(value)}
          disabled={disabled}
          onChange={(selected) => onChange(selected === '' ? undefined : choices.find((c) => show(c) === selected))}
          options={required ? options : [{ value: '', label: t('administration.policies.form.unset') }, ...options]}
          className="max-w-xs"
          triggerClassName={SELECT_TRIGGER}
        />
      </Labelled>
    );
  }

  if (type === 'boolean') {
    return (
      <div className="flex flex-col gap-0.5">
        <Switch id={id} checked={value === true} disabled={disabled} onChange={onChange} label={label} />
        {hint ? <p className="ml-14 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
      </div>
    );
  }

  if (type === 'integer' || type === 'number') {
    return (
      <Labelled id={id} label={label} hint={hint} required={required}>
        <TextInput
          id={id}
          type="number"
          disabled={disabled}
          min={schema.minimum}
          max={schema.maximum}
          step={type === 'integer' ? 1 : 'any'}
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => {
            if (e.target.value === '') return onChange(undefined);
            const parsed = type === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value);
            onChange(Number.isNaN(parsed) ? undefined : parsed);
          }}
          className="max-w-[12rem]"
        />
      </Labelled>
    );
  }

  if (type === 'array') {
    const items = resolveSchema(schema.items, root);
    const itemChoices = choicesOf(items, root);
    const list = Array.isArray(value) ? value : [];
    if (itemChoices) {
      return (
        <Labelled id={id} label={label} hint={hint} required={required}>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5" role="group" aria-labelledby={`${id}-label`}>
            {itemChoices.map((choice) => {
              const checked = list.some((v) => show(v) === show(choice));
              return (
                <label key={show(choice)} className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={checked}
                    onChange={() =>
                      onChange(checked ? list.filter((v) => show(v) !== show(choice)) : [...list, choice])
                    }
                    className="accent-primary"
                  />
                  {show(choice)}
                </label>
              );
            })}
          </div>
        </Labelled>
      );
    }
    if (typeOf(items) === 'string') {
      return (
        <Labelled id={id} label={label} hint={hint || t('administration.policies.form.onePerLine')} required={required}>
          <textarea
            id={id}
            disabled={disabled}
            rows={Math.max(2, list.length + 1)}
            value={list.map(show).join('\n')}
            onChange={(e) => {
              const lines = e.target.value.split('\n').map((line) => line.trim()).filter(Boolean);
              onChange(lines.length ? lines : undefined);
            }}
            className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-100"
          />
        </Labelled>
      );
    }
  }

  if (type === 'string') {
    return (
      <Labelled id={id} label={label} hint={hint} required={required}>
        <TextInput
          id={id}
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
          className="max-w-md"
        />
      </Labelled>
    );
  }

  return (
    <Labelled id={id} label={label} hint={hint} required={required}>
      <JsonBox id={id} value={value} onChange={onChange} invalidLabel={t('administration.policies.form.invalidJson')} />
    </Labelled>
  );
}

function Labelled({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
        {required ? <span className="ml-0.5 text-redText dark:text-red">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}

/** The whole document as a form, or as raw JSON when the admin prefers (or the schema did not load). */
export default function SchemaForm({
  schema,
  value,
  onChange,
  disabled,
  hidden,
}: {
  schema: IJsonSchema | null | undefined;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
  hidden?: string[];
}) {
  const { t } = useTranslation();
  const [raw, setRaw] = useState(!schema);
  const id = useId();

  return (
    <div className="flex flex-col gap-3">
      {schema ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setRaw((r) => !r)}
            aria-pressed={raw}
            className="text-xs font-medium text-primary hover:underline dark:text-primaryLight"
          >
            {raw ? t('administration.policies.form.showForm') : t('administration.policies.form.showJson')}
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.policies.form.noSchema')}</p>
      )}
      {raw || !schema ? (
        <JsonBox
          id={id}
          value={value}
          onChange={(next) => next && typeof next === 'object' && !Array.isArray(next) && onChange(next as Record<string, unknown>)}
          invalidLabel={t('administration.policies.form.invalidJson')}
        />
      ) : (
        <SchemaField
          schema={schema}
          root={schema}
          name=""
          value={value}
          disabled={disabled}
          hidden={hidden}
          onChange={(next) => onChange((next ?? {}) as Record<string, unknown>)}
        />
      )}
    </div>
  );
}
