import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { createStore } from "solid-js/store";
import Nav from "~/components/Nav";
import "./app.css";

type DynamicUser = Record<string, string | number | boolean>;

type AppStore = {
  count: number;
  name: string;
  age: number;
  user: DynamicUser;
};

export const [store, setStore] = createStore<AppStore>({
  count: 0,
  name: "John",
  age: 25,
  user: {},
});

export default function App() {
  return (
    <Router
      root={props => (
        <>
          <Nav />
          <Suspense>{props.children}</Suspense>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
