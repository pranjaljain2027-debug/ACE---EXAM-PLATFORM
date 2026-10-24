/** Learning paths (plan §17): CogAT, OLSAT, NNAT and General Reasoning, then topics, then questions. */
import React from 'react';
import { ArrowLeft, CheckCircle2, Circle, ChevronRight, Clock } from 'lucide-react';
import { Link, navigate } from '../../app/router';
import { bankApi } from '../../services/bank';
import { QUESTION_TYPES } from '../../content/bank/taxonomy';
import { friendlyError } from '../../lib/supabase';
import { Card, EmptyState, ErrorState, Spinner, useAsync } from '../../ui/kit';

let catalogCache: ReturnType<typeof bankApi.catalog> | null = null;
const catalog = () => (catalogCache ??= bankApi.catalog().catch((e) => { catalogCache = null; throw e; }));

const typeTitle = (id: string) => QUESTION_TYPES.find((t) => t.id === id)?.title ?? id;

export const PathsHome: React.FC<{ base: string }> = ({ base }) => {
  const d = useAsync(catalog, []);
  if (d.error) return <ErrorState message={friendlyError(new Error(d.error))} onRetry={d.reload} />;
  if (!d.data) return <Spinner label="Loading paths" />;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-navy">Paths</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {d.data.map((p) => {
          const live = p.sections.flatMap((s) => s.topics).filter((t) => t.published > 0).length;
          const all = p.sections.flatMap((s) => s.topics).length;
          return (
            <Link key={p.id} to={`${base}/paths/${p.id}`} className="block rounded-2xl border border-line bg-paper p-5 hover:border-navy/40">
              <span className="block text-lg font-bold text-navy">{p.title}</span>
              <span className="block text-sm text-muted mt-1">{p.description}</span>
              <span className="block text-xs font-semibold text-forest mt-3">{live} of {all} topics ready</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const PathView: React.FC<{ base: string; pathId: string }> = ({ base, pathId }) => {
  const d = useAsync(catalog, []);
  if (d.error) return <ErrorState message={friendlyError(new Error(d.error))} onRetry={d.reload} />;
  if (!d.data) return <Spinner label="Loading path" />;
  const p = d.data.find((x) => x.id === pathId);
  if (!p) return <EmptyState title="Path not found" action={<Link to={`${base}/paths`} className="underline font-semibold">All paths</Link>} />;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link to={`${base}/paths`} className="inline-flex items-center gap-2 text-sm font-semibold text-navy"><ArrowLeft className="w-4 h-4" aria-hidden /> All paths</Link>
      <div>
        <h1 className="text-3xl font-bold text-navy">{p.title}</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">{p.description}</p>
      </div>
      {p.sections.map((s) => (
        <section key={s.id} className="space-y-3">
          <h2 className="text-xl font-bold">{s.title}</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {s.topics.map((t) => {
              const ready = t.published > 0;
              return (
                <li key={t.id}>
                  <button type="button" disabled={!ready} onClick={() => navigate(`${base}/topic/${t.id}`)}
                    className={`w-full h-full text-left rounded-2xl border-2 p-4 ${ready ? 'border-line bg-paper hover:border-navy/40' : 'border-dashed border-line bg-ivory cursor-not-allowed'}`}
                    aria-label={`${t.title}. ${ready ? `${t.published} puzzles` : 'Not yet available'}`}>
                    <span className="block font-bold text-navy">{t.title}</span>
                    <span className="block text-xs text-muted mt-1">{t.types.map(typeTitle).join(', ')}</span>
                    <span className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${ready ? 'text-forest' : 'text-muted'}`}>
                      {ready ? <>{t.published} puzzle{t.published === 1 ? '' : 's'} <ChevronRight className="w-3 h-3" aria-hidden /></> : <><Clock className="w-3 h-3" aria-hidden /> Not yet available</>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};

export const TopicView: React.FC<{ base: string; topicId: string; childId: string }> = ({ base, topicId, childId }) => {
  const d = useAsync(async () => {
    const [cat, qs] = await Promise.all([catalog(), bankApi.topicQuestions(childId, topicId)]);
    const path = cat.find((p) => p.sections.some((s) => s.topics.some((t) => t.id === topicId)));
    const topic = path?.sections.flatMap((s) => s.topics).find((t) => t.id === topicId);
    return { path, topic, qs };
  }, [childId, topicId]);
  if (d.error) return <ErrorState message={friendlyError(new Error(d.error))} onRetry={d.reload} />;
  if (!d.data) return <Spinner label="Loading puzzles" />;
  const { path, topic, qs } = d.data;
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {path && <Link to={`${base}/paths/${path.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-navy"><ArrowLeft className="w-4 h-4" aria-hidden /> {path.title}</Link>}
      <h1 className="text-3xl font-bold text-navy">{topic?.title ?? 'Puzzles'}</h1>
      {!qs.length ? <EmptyState title="Not yet available">These puzzles are still being checked by our reviewers.</EmptyState> : (
        <ol className="space-y-2">
          {qs.map((q, i) => (
            <li key={q.id}>
              <Card className="p-0">
                <button type="button" onClick={() => navigate(`${base}/q/${q.id}`)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-navy/5 rounded-2xl">
                  {q.solved ? <CheckCircle2 className="w-6 h-6 text-forest shrink-0" aria-hidden /> : <Circle className="w-6 h-6 text-muted shrink-0" aria-hidden />}
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-navy">{i + 1}. {q.title}</span>
                    <span className="block text-xs text-muted">{typeTitle(q.question_type)} · level {q.difficulty}{q.answered && !q.solved ? ' · try again' : ''}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted" aria-hidden />
                </button>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
