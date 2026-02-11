import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useEffect } from "react";

interface JournalEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const ToolbarButton = ({
  pressed,
  onPressedChange,
  children,
  title,
}: {
  pressed: boolean;
  onPressedChange: () => void;
  children: React.ReactNode;
  title: string;
}) => (
  <Toggle
    pressed={pressed}
    onPressedChange={onPressedChange}
    size="sm"
    title={title}
    className="h-8 w-8 p-0 rounded-md border border-transparent transition-all duration-200
      data-[state=on]:bg-primary/20 data-[state=on]:border-primary/40 data-[state=on]:text-primary data-[state=on]:shadow-[0_0_12px_hsl(var(--primary)/0.3)]
      hover:bg-muted/40 hover:border-border/40 text-muted-foreground"
  >
    {children}
  </Toggle>
);

export function JournalEditor({ content, onChange, placeholder }: JournalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      TextStyle,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] max-h-[400px] overflow-y-auto px-4 py-3 text-foreground/90 leading-[1.8] text-[15px] font-light focus:outline-none prose prose-invert prose-sm max-w-none",
        style: "font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (e.g. when editing an existing entry)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border/20 bg-card/50">
        <ToolbarButton
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="ml-auto text-[10px] font-mono text-muted-foreground/40 tracking-wider uppercase">
          NEURAL_INPUT
        </div>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Placeholder overlay */}
      {editor.isEmpty && placeholder && (
        <div
          className="absolute pointer-events-none px-4 py-3 text-muted-foreground/30 text-[15px] font-light"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", top: "calc(2.5rem + 1px)" }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}
