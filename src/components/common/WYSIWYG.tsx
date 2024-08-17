import {
  BtnBold,
  BtnUnderline,
  BtnRedo,
  BtnUndo,
  BtnItalic,
  ContentEditableEvent,
  Editor,
  EditorProvider,
  Toolbar,
  HtmlButton,
} from 'react-simple-wysiwyg';

interface IWYSIWYGParams {
  value: string;
  onChange: (event: ContentEditableEvent) => void;
}

const WYSIWYG = ({ value, onChange }: IWYSIWYGParams) => {
  return (
    <EditorProvider>
      <Editor
        containerProps={{
          style: { overflowY: 'scroll', height: '100%', width: '100%' },
        }}
        value={value}
        onChange={onChange}
      >
        <Toolbar>
          <BtnRedo />
          <BtnUndo />
          <BtnBold />
          <BtnItalic />
          <BtnUnderline />
          <HtmlButton />
        </Toolbar>
      </Editor>
    </EditorProvider>
  );
};

export default WYSIWYG;
