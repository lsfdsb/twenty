import { lazy, Suspense } from 'react';

import { headlessCommandContextApisState } from '@/command-menu-item/engine-command/states/headlessCommandContextApisState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const CommandRunner = lazy(() =>
  import('@/command-menu-item/engine-command/components/CommandRunner').then(
    (module) => ({ default: module.CommandRunner }),
  ),
);

export const DeferredCommandRunner = () => {
  const headlessCommandContextApis = useAtomStateValue(headlessCommandContextApisState);

  if (headlessCommandContextApis.size === 0) return null;

  return (
    <Suspense fallback={null}>
      <CommandRunner />
    </Suspense>
  );
};
