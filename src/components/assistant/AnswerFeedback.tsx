import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { AiMessage } from '../../providers/AppProvider';
import useAnswerFeedback from '../../hooks/api/assistant/useAnswerFeedback';

/**
 * Thumbs up / down under an answer, with an optional reason for a thumbs down (IP-030 Q13). A new rating
 * replaces the previous one.
 */
export default function AnswerFeedback({ msg }: { msg: AiMessage }) {
  const { t } = useTranslation();
  const rate = useAnswerFeedback();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const rating = msg.feedback?.rating;

  const send = async (value: 1 | -1, why?: string) => {
    setBusy(true);
    try {
      await rate(msg, { rating: value, reason: why });
      setAsking(false);
      setReason('');
      toast.success(t('assistant.feedback.thanks'));
    } catch {
      toast.error(t('assistant.feedback.failed'));
    } finally {
      setBusy(false);
    }
  };

  const button = (value: 1 | -1) => {
    const Icon = value === 1 ? FiThumbsUp : FiThumbsDown;
    const label = value === 1 ? t('assistant.feedback.good') : t('assistant.feedback.bad');
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-pressed={rating === value}
        disabled={busy}
        onClick={() => (value === 1 ? send(1) : setAsking((open) => !open))}
        className={`p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 ${
          rating === value ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        <Icon size={13} fill={rating === value ? 'currentColor' : 'none'} />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-0.5">
        {button(1)}
        {button(-1)}
      </div>
      {asking ? (
        <form
          className="flex items-center gap-2 max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            send(-1, reason.trim() || undefined);
          }}
        >
          <input
            autoFocus
            type="text"
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('assistant.feedback.reasonPlaceholder')}
            aria-label={t('assistant.feedback.reasonPlaceholder')}
            className="flex-1 text-xs px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-black dark:text-white outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-xs px-2 py-1 rounded-md bg-primary text-white hover:bg-primaryDark disabled:opacity-60"
          >
            {t('assistant.feedback.send')}
          </button>
        </form>
      ) : null}
    </div>
  );
}
