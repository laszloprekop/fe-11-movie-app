import { useEffect, useState } from 'react';
import { getDashboard } from '../api/reports';
import type { DashboardDto } from '../api/types';
import ErrorBanner from '../components/ErrorBanner';
import StatBars from '../components/StatBars';

type PageState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; dashboard: DashboardDto };

export default function Dashboard() {
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    let ignore = false;
    getDashboard()
      .then((dashboard) => {
        if (!ignore) setState({ status: 'ready', dashboard });
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ status: 'error', error });
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {state.status === 'loading' && <p className="mt-4">Räknar ihop statistiken…</p>}
      {state.status === 'error' && <ErrorBanner error={state.error} />}
      {state.status === 'ready' && (
        <div className="mt-4 grid max-w-5xl gap-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="stat-tile">
              <p className="text-xs uppercase tracking-widest opacity-60">Genomsnittsbetyg</p>
              <p className="mt-1 text-3xl font-bold">
                {state.dashboard.averageRating ?? '–'}
                <span className="ml-2 text-sm font-normal opacity-70">av 5</span>
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-xs uppercase tracking-widest opacity-60">Recensioner</p>
              <p className="mt-1 text-3xl font-bold">{state.dashboard.reviewCount}</p>
            </div>
            <div className="stat-tile">
              <p className="text-xs uppercase tracking-widest opacity-60">Genrer</p>
              <p className="mt-1 text-3xl font-bold">{state.dashboard.topRatedPerGenre.length}</p>
            </div>
          </div>

          {/* Masonry via CSS columns: cards fill the shortest column and
              refuse to break. Unrated movies (and genres left empty by the
              filter) never chart — a bar of nothing says nothing. */}
          <div className="columns-1 gap-8 md:columns-2 xl:columns-3">
            {state.dashboard.topRatedPerGenre
              .map((group) => ({
                ...group,
                movies: group.movies.filter((m) => m.reviewCount > 0),
              }))
              .filter((group) => group.movies.length > 0)
              .map((group) => (
                <section key={group.genre} className="mb-8 break-inside-avoid">
                  <h3 className="font-bold">{group.genre}</h3>
                  {/* Ratings share one scale — max 5 keeps the genres comparable. */}
                  <StatBars
                    data={group.movies}
                    nameKey="title"
                    valueKey="averageRating"
                    label="Betyg"
                    max={5}
                  />
                </section>
              ))}
            <section className="mb-8 break-inside-avoid">
              <h3 className="font-bold">Mest aktiva skådespelare</h3>
              <StatBars
                data={state.dashboard.mostActiveActors}
                nameKey="name"
                valueKey="movieCount"
                label="Filmer"
              />
            </section>
          </div>
        </div>
      )}
    </>
  );
}
