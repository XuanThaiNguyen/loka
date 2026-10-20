import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Alert, BackHandler, Keyboard, Pressable, Text } from 'react-native';
import { useState } from 'react';
import { CreateTripScreen, PlannerTaskScreen } from '@/features/travel-plan/screens/travel-plan-screen';
import { useTaskNavigation } from '@/features/task-flow/use-task-navigation';
import en from '@/i18n/locales/en';

let mockHardwareBack: () => boolean;
let mockPrevented = false;
let mockRemoval: (event: { data: { action: object } }) => void;
let mockParams: Record<string, string> = {};
let mockPending = false;
let mockSession: Record<string, unknown> | null = null;
let mockTrip = { id: 1, name: 'Da Nang journey', startDate: '2026-11-12', endDate: '2026-11-16', accessRole: 'owner', crewNumber: 2, companions: [], stops: [], plannerSessionId: null as string | null };
const mockCreateTrip = jest.fn();
const mockCreateSession = jest.fn();
const mockUpdateSession = jest.fn();
const mockNavigate = jest.fn(() => { expect(mockPrevented).toBe(false); });
const mockBack = jest.fn();
const mockDispatch = jest.fn();
const mockTranslate = (key: string, options?: Record<string, unknown>) => {
  const value = key.split('.').reduce((obj: any, part) => obj?.[part], en);
  return typeof value === 'string' ? value.replace(/{{(\w+)}}/g, (_, name) => String(options?.[name] ?? '')) : key;
};
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate, i18n: { language: 'en' } }) }));
jest.mock('@/i18n', () => ({ i18n: { language: 'en', t: (...args: Parameters<typeof mockTranslate>) => mockTranslate(...args) } }));
jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), canGoBack: () => true, replace: (...args: unknown[]) => mockNavigate(...args as []), dismissTo: (...args: unknown[]) => mockNavigate(...args as []), setParams: jest.fn() },
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ dispatch: mockDispatch }),
  useFocusEffect: (callback: () => (() => void)) => jest.requireActual("react").useEffect(callback, [callback]),
}));
jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: (prevent: boolean, callback: typeof mockRemoval) => { mockPrevented = prevent; mockRemoval = callback; } }));
jest.mock('@/features/trips/services/trips-api-service', () => ({
  useCreateTrip: () => ({ isPending: mockPending, mutateAsync: mockCreateTrip }),
  useTrip: () => ({ data: mockTrip, isPending: false, refetch: jest.fn() }),
  useTrips: () => ({ data: [], isPending: false }),
}));
jest.mock('@/features/travel/services/travel-api-service', () => ({ useCitySuggestions: () => ({ data: [] }) }));
jest.mock('@/features/travel-plan/services/planner-api-service', () => ({
  useCreatePlannerSession: () => ({ isPending: mockPending, mutateAsync: mockCreateSession }),
  useUpdatePlannerSession: () => ({ isPending: mockPending, mutateAsync: mockUpdateSession }),
  usePlannerSession: (id: string | null) => ({ data: id ? mockSession : null, isPending: false }),
  useDeletePlannerSession: () => ({ isPending: false }),
}));

beforeEach(() => {
  jest.clearAllMocks(); mockPrevented = false; mockPending = false; mockParams = {}; mockSession = null;
  mockTrip = { ...mockTrip, plannerSessionId: null };
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, callback) => { mockHardwareBack = callback as () => boolean; return { remove: jest.fn() }; });
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

async function press(name: string) { await userEvent.setup().press(screen.getByRole('button', { name })); }
function alertChoice(text: string) {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
  const choice = buttons?.find(button => button.text === text);
  expect(choice).toBeDefined();
  return act(() => choice?.onPress?.());
}
async function fillTrip() {
  await fireEvent.changeText(screen.getByPlaceholderText(en.travelPlan.workspace.tripNamePlaceholder), 'Draft journey');
  await press('Continue'); await press('Continue');
}

test('clean Close exits without a discard prompt', async () => {
  await render(<CreateTripScreen />);
  await press('Close');
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('dirty Close can keep editing or explicitly discard', async () => {
  await render(<CreateTripScreen />);
  await fireEvent.changeText(screen.getByPlaceholderText(en.travelPlan.workspace.tripNamePlaceholder), 'Keep this name');
  await press('Close'); await alertChoice('Keep editing');
  expect(screen.getByDisplayValue('Keep this name')).toBeOnTheScreen();
  expect(mockBack).not.toHaveBeenCalled();
  await press('Close'); await alertChoice('Discard');
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
});

test('Create Back retains fields and displays exactly one step indicator', async () => {
  await render(<CreateTripScreen />); await fillTrip();
  expect(screen.getAllByText('3 / 3')).toHaveLength(1);
  await press('Back'); await press('Back');
  expect(screen.getByDisplayValue('Draft journey')).toBeOnTheScreen();
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('create failure retains draft; repeated submit while unresolved sends one request; retry navigates with actual ID after releasing guard', async () => {
  let reject!: (error: Error) => void;
  mockCreateTrip.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  await render(<CreateTripScreen />); await fillTrip();
  await press(en.travelPlan.workspace.createAndPlan); await press(en.travelPlan.workspace.createAndPlan);
  expect(mockCreateTrip).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('Offline')));
  expect(screen.getByText('Draft journey')).toBeOnTheScreen();
  mockCreateTrip.mockResolvedValueOnce({ data: { id: 42 } });
  await press(en.travelPlan.workspace.createAndPlan);
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/planner/[tripId]', params: { tripId: '42' } }));
  expect(mockCreateTrip.mock.calls[0][0]).not.toHaveProperty('budgetVnd');
});

test('planner step 4 Back/Continue retains notes and interests; fast trip refetch cannot steal success navigation', async () => {
  mockParams = { tripId: '1' };
  await render(<PlannerTaskScreen />);
  await fireEvent.changeText(screen.getByPlaceholderText(en.travelPlan.chat.placeholders.origin), 'Hanoi');
  await press('Continue');
  expect(screen.queryByText(en.travelPlan.workspace.budgetAmount)).not.toBeOnTheScreen();
  await press('Continue');
  await userEvent.setup().press(screen.getAllByRole('checkbox')[0]);
  await press('Continue');
  await fireEvent.changeText(screen.getByPlaceholderText(en.travelPlan.workspace.notesPlaceholder), 'Keep my notes');
  await press('Back');
  expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
  await press('Continue');
  expect(screen.getByDisplayValue('Keep my notes')).toBeOnTheScreen();
  let resolve!: (value: unknown) => void;
  mockCreateSession.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await press(en.travelPlan.workspace.saveWorkspace);
  mockTrip = { ...mockTrip, plannerSessionId: 'new-session' };
  await screen.rerender(<PlannerTaskScreen />);
  expect(screen.getByDisplayValue('Keep my notes')).toBeOnTheScreen();
  await act(async () => resolve({ data: { id: 'new-session', tripId: 1 } }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/trip/[id]', params: { id: '1' } }));
  expect(mockCreateSession.mock.calls[0][0]).toMatchObject({ tripId: 1, origin: 'Hanoi', notes: 'Keep my notes' });
  expect(mockCreateSession.mock.calls[0][0]).not.toHaveProperty('budgetAmountMinor');
});

function GuardHarness({ pending = false }: { pending?: boolean }) {
  const [step, setStep] = useState(3);
  const task = useTaskNavigation({ dirty: true, pending, step, previous: () => setStep(value => value - 1) });
  return <><Text>{`Step ${step}`}</Text><Pressable accessibilityRole="button" onPress={task.back}><Text>Back</Text></Pressable><Pressable accessibilityRole="button" onPress={() => task.complete(mockNavigate)}><Text>Complete</Text></Pressable></>;
}

test('system removal on later step goes back one step, preserving the screen', async () => {
  await render(<GuardHarness />);
  await act(() => mockRemoval({ data: { action: { type: 'GO_BACK' } } }));
  expect(screen.getByText('Step 2')).toBeOnTheScreen();
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('Back dismisses keyboard before changing step; pending save blocks Back and removal', async () => {
  await render(<GuardHarness />);
  jest.mocked(Keyboard.isVisible).mockReturnValue(true);
  await act(() => { mockHardwareBack(); });
  expect(Keyboard.dismiss).toHaveBeenCalled();
  expect(screen.getByText('Step 3')).toBeOnTheScreen();
  jest.mocked(Keyboard.isVisible).mockReturnValue(false);
  await screen.rerender(<GuardHarness pending />);
  await press('Back');
  await act(() => mockRemoval({ data: { action: { type: 'GO_BACK' } } }));
  expect(screen.getByText('Step 3')).toBeOnTheScreen();
  expect(mockDispatch).not.toHaveBeenCalled();
});

test('completion releases guard and executes one navigation despite a rapid Back', async () => {
  await render(<GuardHarness />);
  await press('Complete'); await press('Back');
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
});


test('saved workspace edit retries without losing input or overwriting stored money', async () => {
  mockParams = { tripId: '1', mode: 'edit' };
  mockTrip = { ...mockTrip, plannerSessionId: 'saved-session' };
  mockSession = {
    id: 'saved-session', tripId: 1, accessRole: 'owner', origin: 'Hanoi', destination: 'Da Nang',
    pace: 'balanced', interestIds: ['relaxation'], mustDoActivities: [], notes: 'Original note',
    budgetAmountMinor: 123456, currency: 'VND', budgetScope: 'group',
  };
  await render(<PlannerTaskScreen />);
  await press('Continue'); await press('Continue'); await press('Continue');
  await fireEvent.changeText(screen.getByDisplayValue('Original note'), 'Updated note');
  mockUpdateSession.mockRejectedValueOnce(new Error('Offline'));
  await press('Save');
  expect(screen.getByDisplayValue('Updated note')).toBeOnTheScreen();
  expect(mockNavigate).not.toHaveBeenCalled();
  mockUpdateSession.mockResolvedValueOnce({ data: { ...mockSession, notes: 'Updated note' } });
  await press('Save');
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/trip/[id]', params: { id: '1' } }));
  const input = mockUpdateSession.mock.calls[1][0].input;
  expect(input.notes).toBe('Updated note');
  for (const field of ['budgetAmountMinor', 'currency', 'budgetScope']) expect(input).not.toHaveProperty(field);
  expect(mockSession.budgetAmountMinor).toBe(123456);
});
