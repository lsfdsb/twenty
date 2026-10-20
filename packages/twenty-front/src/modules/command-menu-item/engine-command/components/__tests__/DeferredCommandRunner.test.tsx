import { render, screen } from '@testing-library/react';

import { DeferredCommandRunner } from '@/command-menu-item/engine-command/components/DeferredCommandRunner';

let pendingCount = 0;
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: () => ({ size: pendingCount }),
}));
jest.mock(
  '@/command-menu-item/engine-command/components/CommandRunner',
  () => ({
    CommandRunner: () => <div>Comando em execução</div>,
  }),
);

describe('DeferredCommandRunner', () => {
  it('mounts the executor when work arrives and removes it when finished', async () => {
    const { rerender } = render(<DeferredCommandRunner />);
    expect(screen.queryByText('Comando em execução')).not.toBeInTheDocument();
    pendingCount = 1;
    rerender(<DeferredCommandRunner />);
    expect(await screen.findByText('Comando em execução')).toBeInTheDocument();
    pendingCount = 0;
    rerender(<DeferredCommandRunner />);
    expect(screen.queryByText('Comando em execução')).not.toBeInTheDocument();
  });
});
