import test from 'ava';
import Analytics from '../src';
import sinon from "sinon";
import delay from './_utils/delay';

test.beforeEach((t) => {
  t.context.sandbox = sinon.createSandbox();
})

test("Plugin Added > Disabled add returns true", async (t) => {
  const analytics = Analytics({ app: 'hello' });
  const addedPluginResult = await analytics.plugins.add({
    name: "testing-one-two",
    enabled: false,
    track: () => "thing",
  });

  t.is(addedPluginResult, true);
});

test("Plugin Added > Invalid plugin return false", async (t) => {
  const analytics = Analytics({ app: 'hello-failed' });
  const invalidPluginAdded = await analytics.plugins.add(false);

  t.is(invalidPluginAdded, false);
});

test("Plugin Added > Loads and Initis", async (t) => {
  const { context } = t;
  const spyLoad = context.sandbox.spy(() => true);
  const spyInit = context.sandbox.spy();

  const analytics = Analytics({ app: "hello-new-plugins" });
  await analytics.plugins.add({
    name: "late-to-the-party",
    enabled: true,
    loaded: spyLoad,
    initialize: spyInit,
  });

  const pluginsState = analytics.getState("plugins");

  t.is(pluginsState["late-to-the-party"].enabled, true);
  t.is(pluginsState["late-to-the-party"].initialized, true);
  t.is(spyInit.callCount, 1);
  t.is(spyLoad.callCount >= 1, true);
});

test("Plugin Added > Disabled will not", async (t) => {
  const { context } = t;
  const spyLoad = context.sandbox.spy(() => true);
  const spyInit = context.sandbox.spy();

  const analytics = Analytics({
    app: "hello-disabled"
  });
  await analytics.plugins.add({
    name: "disabled-test",
    enabled: false,
    loaded: spyLoad,
    initialize: spyInit
  });
  const pluginsState = analytics.getState("plugins");

  t.is(pluginsState["disabled-test"].enabled, false);
  t.is(pluginsState["disabled-test"].initialized, false);
  t.is(pluginsState["disabled-test"].loaded, false);  
});

// Any delay in a test with async code is a bad idea....
test("Plugin Added > Register Plugin with add is async", async (t) => {
  const analytics = Analytics({
    app: "async-register" // It's not as exciting as it sounds -_-
  });

  await analytics.plugins.add({
    name: "async-register",
    track: () => ""
  });

  t.is(analytics.getState("plugins.async-register").enabled, true);

  await analytics.plugins.add({
    name: "async-register-disabled",
    enabled: false,
    track: () => ""
  });

  t.is(analytics.getState("plugins.async-register-disabled").enabled, false);
});

// Had to hoist state to force control delay on load
let finishLoading = false;
test("Plugin Added > Queueded as expected", async (t) => {
  const analytics = Analytics({
    app: "queue-test",
    plugins: [
      {
        name: "added",
        enabled: true,
        track: () => ""
      }
    ]
  });

  await analytics.plugins.add({
    name: "late-queue",
    enabled: true,
    loaded: () => {
      return finishLoading;
    },
    track: () => {
      return "";
    }
  });

  await analytics.track("random");
  await analytics.track("random");
  await analytics.track("random");

  // Check for expected queueing
  const pluginsState = analytics.getState("queue.actions");
  t.is(pluginsState.length, 3);

  finishLoading = true;
  // Here the delay is to give the queue time to drain
  await delay(100);

  // Check if drains successfully
  const drainedPluginsState = analytics.getState();
  t.is(drainedPluginsState.queue.actions.length, 0);
  t.is(drainedPluginsState.track.history.length, 3);
});

test.todo("Plugin Added > Custom events are added to the middleware");
