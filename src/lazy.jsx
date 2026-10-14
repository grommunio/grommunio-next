// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { lazy, Suspense } from "react";
import Loading from "./components/Loading";

const RELOAD_KEY = "chunkReload";

// Old chunks are gone after a deploy. Reload once for the new index.html,
// the sessionStorage flag stops a reload loop.
export function reloadOnce(storage = window.sessionStorage, reload = () => window.location.reload()) {
  try {
    if (storage.getItem(RELOAD_KEY)) return false;
    storage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  reload();
  return true;
}

export function withChunkRetry(loader, storage = window.sessionStorage, reload = () => window.location.reload()) {
  return () => loader().then(module => {
    try { storage.removeItem(RELOAD_KEY); } catch { /* storage disabled */ }
    return module;
  }, err => {
    // Never resolves: the page is reloading
    if (reloadOnce(storage, reload)) return new Promise(() => undefined);
    throw err;
  });
}

export default function makeLoadableComponent(loader, LoaderComponent) {
  const AsyncComponent = lazy(withChunkRetry(loader));
  const LoadableComponent = (props={}) => ( // TODO: Create loader component
    <Suspense fallback={LoaderComponent || <Loading />}>
      <AsyncComponent {...props}/>
    </Suspense>
  );
  return LoadableComponent;
}
