import { createEffect, createMemo } from "solid-js";
import { store, setStore } from "~/app";

export default function Counter() {
  createEffect(() => {
    console.log("count effect:", store.count);
  });

  createEffect(() => {
    console.log("user name:", store.user.name, "user role:", store.user.role);
  });

  createEffect(() => {
    console.log("user count:", store.user.count, );
  });

  const count = createMemo(() => store.user.count)

  return (
    <div class="space-y-5">
      <button
        class="w-[200px] rounded-full bg-gray-100 border-2 border-gray-300 focus:border-gray-400 active:border-gray-400 px-[2rem] py-[1rem]"
        onClick={() => setStore("count", (prev) => prev + 1)}
      >
        Clicks: {store.count}
      </button>

      <div>
        <button
          class="mr-2 px-3 py-1 bg-gray-200 rounded"
          onClick={() =>
            setStore("user", {
              name: "processed",
              count: 0,
              role: "admin",
            })
          }
        >
          Set User
        </button>
      </div>


      <div>
        <button
          class="mr-2 px-3 py-1 bg-gray-200 rounded"
          onClick={() =>
            setStore("user", "count", (prev) => (typeof prev === "number" ? prev + 1 : 1))
          }
        >
          User Count {count()} + 1 = {count() || 0  + 1}
        </button>
      </div>

      <div class="text-left space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">User name</label>
          <input
            type="text"
            value={String(store.name)}
            onInput={(e) => setStore("user", "name", e.currentTarget.value)}
            class="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">User age</label>
          <input
            type="number"
            value={Number(store.age)}
            onInput={(e) =>
              setStore("user", "age", parseInt(e.currentTarget.value) || 0)
            }
            class="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
}
