// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { lazy, Suspense } from "react";
import Loading from "./components/Loading";

export default function makeLoadableComponent(loader) {
  const AsyncComponent = lazy(loader);
  const LoadableComponent = (props={}) => ( // TODO: Create loader component
    <Suspense fallback={<Loading />}>
      <AsyncComponent {...props}/>
    </Suspense>
  );
  return LoadableComponent;
}