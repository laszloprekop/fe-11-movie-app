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
        <div className="mt-4 grid max-w-3xl gap-8">
          <section>
            <h2 className="text-xl font-bold">Genomsnittsbetyg</h2>
            <p className="mt-2 text-4xl font-bold">
              {state.dashboard.averageRating ?? '–'}
              <span className="ml-2 text-base font-normal">
                av 5, från {state.dashboard.reviewCount} recensioner
              </span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Topp 5 filmer per genre</h2>
            {state.dashboard.topRatedPerGenre.map((group) => (
              <div key={group.genre} className="mt-3">
                <h3 className="font-bold">{group.genre}</h3>
                {/* Ratings share one scale — max 5 keeps the genres comparable. */}
                <StatBars
                  data={group.movies}
                  nameKey="title"
                  valueKey="averageRating"
                  label="Betyg"
                  max={5}
                />
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-xl font-bold">Mest aktiva skådespelare</h2>
            <div className="mt-2">
              <StatBars
                data={state.dashboard.mostActiveActors}
                nameKey="name"
                valueKey="movieCount"
                label="Filmer"
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
