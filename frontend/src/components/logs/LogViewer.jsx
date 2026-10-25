import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown } from 'lucide-react';

export default function LogViewer({ lines, connected, error }) {
    const { t } = useTranslation();
    const scrollRef = useRef(null);
    const [atBottom, setAtBottom] = useState(true);

    // Auto-Scroll, wenn der User am Boden ist.
    useEffect(() => {
        if (atBottom && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines, atBottom]);

    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
    };

    const jumpToBottom = () => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
        setAtBottom(true);
    };

    if (error) return <div className="logviewer__state logviewer__state--error">{t('pages.logs.error')}</div>;
    if (lines.length === 0) return <div className="logviewer__state">{t('pages.logs.empty')}</div>;

    return (
        <div className="logviewer">
            <div className="logviewer__scroll" ref={scrollRef} onScroll={onScroll}>
                {lines.map((l, i) => (
                    <div key={i} className={`logviewer__line logviewer__line--${(l.level || 'raw').toLowerCase()}`}>
                        <span className="logviewer__ts">{l.ts || ''}</span>
                        <span className="logviewer__level">{l.level || '·'}</span>
                        <span className="logviewer__msg">{l.message}</span>
                    </div>
                ))}
            </div>
            {!atBottom && (
                <button type="button" className="logviewer__jump" onClick={jumpToBottom}>
                    <ArrowDown size={14} /> {t('pages.logs.jumpToLatest')}
                </button>
            )}
        </div>
    );
}
