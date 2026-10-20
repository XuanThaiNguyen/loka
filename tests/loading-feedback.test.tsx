import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { HomeSectionState } from '@/features/home/components/home-section-state';
import { LoadingAnnouncement, LoadingScope, QueryFeedback } from '@/components/ui/loading-skeleton';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const refetch = jest.fn();
beforeEach(() => refetch.mockClear());

test('paused Home request offers retry instead of an indefinite skeleton or empty state', async () => {
  await render(<HomeSectionState queries={[{ isPending: true, fetchStatus: 'paused', refetch }]} hasData={false} empty emptyLabel="No trips" />);
  expect(screen.getByRole('alert')).toHaveTextContent('loadingUi.offline');
  expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  expect(screen.queryByText('No trips')).not.toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole('button', { name: 'common.retry' }));
  expect(refetch).toHaveBeenCalledTimes(1);
});

test('cached Home content remains visible with subtle refresh feedback', async () => {
  await render(<><HomeSectionState queries={[{ isFetching: true, fetchStatus: 'fetching', refetch }]} hasData /><Text>Da Nang</Text></>);
  expect(screen.getByText('Da Nang')).toBeOnTheScreen();
  expect(screen.getByText('loadingUi.refreshing')).toBeOnTheScreen();
  expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
});

test('multiple Home skeletons have one screen-level loading announcement', async () => {
  const query = { isPending: true, isFetching: true, fetchStatus: 'fetching', refetch };
  await render(<><LoadingAnnouncement loading /><HomeSectionState queries={[query]} hasData={false} layout="cities" /><HomeSectionState queries={[query]} hasData={false} layout="destinations" /></>);
  expect(screen.getAllByRole('progressbar')).toHaveLength(1);
});

test('failed collection request does not replace a loaded sibling section', async () => {
  await render(<><HomeSectionState queries={[{ refetch }]} hasData /><Text>Recommended place</Text><HomeSectionState queries={[{ isError: true, error: { code: 'REQUEST_TIMEOUT' }, refetch }]} hasData={false} empty /></>);
  expect(screen.getByText('Recommended place')).toBeOnTheScreen();
  expect(screen.getByRole('alert')).toHaveTextContent('loadingUi.timeout');
});

test('a successful empty collection shows its true empty state', async () => {
  await render(<HomeSectionState queries={[{ refetch }]} hasData empty emptyLabel="No collections" />);
  expect(screen.getByText('No collections')).toBeOnTheScreen();
  expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
});

test('a pending disabled query offers recovery rather than loading forever', async () => {
  await render(<QueryFeedback query={{ isPending: true, fetchStatus: 'idle', refetch }} />);
  expect(screen.getByRole('button', { name: 'common.retry' })).toBeOnTheScreen();
  expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
});


test('independent nested panels share one screen-reader loading announcement', async () => {
  const query = { isPending: true, isFetching: true, fetchStatus: 'fetching', refetch };
  await render(<LoadingScope><QueryFeedback query={query} /><QueryFeedback query={query} layout="card" /></LoadingScope>);
  expect(screen.getAllByRole('progressbar')).toHaveLength(1);
});
