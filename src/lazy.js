import { lazy, Suspense } from "react";

export default function makeLoadableComponent(loader) {
  const AsyncComponent = lazy(loader);
  const LoadableComponent = (props={}) => ( // TODO: Create loader component
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent {...props}/>
    </Suspense>
  );
  return LoadableComponent;
}