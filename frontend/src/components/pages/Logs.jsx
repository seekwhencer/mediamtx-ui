import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Play, Trash2 } from 'lucide-react';
import { useLogStream } from '../../hooks/useLogStream';
import LogViewer from '../logs/LogViewer';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LEVELS = ['ERR', 'WAR', 'INF', 'DBG'];

export default function Logs() {
    const { t } = useTranslation();
    const { lines, connected, error, clear } = useLogStream();
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [paused, setPaused] = useState(false);
    const [frozen, setFrozen] = useState(null);

    // Pause = client-seitig: Ansicht einfrieren (Snapshot), WebSocket bleibt verbunden.
    const togglePause = () => {
        if (paused) {
            setPaused(false);
            setFrozen(null);
        } else {
            setFrozen(lines);
            setPaused(true);
        }
    };

    const source = paused && frozen ? frozen : lines;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return source.filter((l) => {
            if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
            if (q && !`${l.message}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [source, levelFilter, search]);

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h2 className="page__title">{t('pages.logs.title')}</h2>
                    <p className="page__subtitle">
                        {t('pages.logs.subtitle')}{' '}
                        <span className={`logs__status${connected ? ' is-on' : ' is-off'}`}>
                            {connected ? t('pages.logs.live') : t('pages.logs.offline')}
                        </span>
                    </p>
                </div>
                <div className="logs__controls">
                    <div className="logs__levels" role="group" aria-label={t('pages.logs.levelFilter')}>
                        <button type="button" className={levelFilter === 'ALL' ? 'is-active' : ''} onClick={() => setLevelFilter('ALL')}>{t('pages.logs.levelAll')}</button>
                        {LEVELS.map((lv) => (
                            <button key={lv} type="button" className={levelFilter === lv ? 'is-active' : ''} onClick={() => setLevelFilter(lv)}>{lv}</button>
                        ))}
                    </div>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('pages.logs.search')} className="logs__search" />
                    <Button variant="secondary" size="sm" icon={paused ? Play : Pause} onClick={togglePause}>
                        {paused ? t('pages.logs.resume') : t('pages.logs.pause')}
                    </Button>
                    <Button variant="secondary" size="sm" icon={Trash2} onClick={clear}>{t('pages.logs.clear')}</Button>
                </div>
            </header>

            <LogViewer lines={filtered} connected={connected} error={error} />
        </div>
    );
}
