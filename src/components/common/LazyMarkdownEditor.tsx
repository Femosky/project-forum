'use client';

import { ComponentProps, ComponentType, useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

type EditorProps = ComponentProps<typeof import('./MarkdownEditor').default>;

// The editor for places most visitors only read, like a post page: its code loads when the box opens, so readers
// don't carry it. Same size as the editor meanwhile, so nothing moves.
export function LazyMarkdownEditor(props: EditorProps) {
    const [Editor, setEditor] = useState<ComponentType<EditorProps> | null>(null);

    useEffect(() => {
        let isCurrent = true;
        void import('./MarkdownEditor').then((loaded) => isCurrent && setEditor(() => loaded.default));
        return () => {
            isCurrent = false;
        };
    }, []);

    if (Editor) return <Editor {...props} />;
    return (
        <div className={twMerge('flex flex-col rounded-[10px] border border-border-strong bg-surface', props.className)}>
            <div className="h-9 border-b border-border" />
            <div className={twMerge('px-3 py-2.5 text-[15px] leading-6 text-subtle', props.variant === 'compact' ? 'min-h-24' : 'min-h-40')}>{props.placeholder}</div>
            {props.footer && <div className="flex items-center justify-end gap-2 px-2 pb-2">{props.footer}</div>}
        </div>
    );
}

export default LazyMarkdownEditor;
