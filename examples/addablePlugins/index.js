const {
  Analytics,
} = require("../../packages/analytics-core/dist/server/analytics-core");

const instance = Analytics({
  name: "test",
  plugins: [
    {
      name: "added-at-start",
      enabled: true,
      track: () => {
        console.log("Hello from start");
      },
    },
  ],
});

const readyPromise = new Promise((res) => {
  instance.on("ready", () => {
    res();
  });
});

readyPromise
  .then(() => {
    const promise = instance.plugins.add({
      name: "late-add",
      config: {
        enabled: true,
      },
      track: ({ instance }) => {
        console.log("from-inner")
        // while this has been added I'm expected to be 
        return instance.plugins.add({
          name: "added-by-plugin",
          enabled: true,
          track: ({ instance }) => {
            console.log("From inner plugin");
            console.log(instance.plugins)
          },
          methods: {
            addedLater() {
              console.log("I'm late to the party!")
            }
          }
        });
      },
    });
    console.log(promise);
    return promise;
  })
  .then(() => {
    console.log("Add done");
    console.log(instance.getState());
    return instance.track("test");
  })
  .then(() => {
    console.log("------------------------")
    return instance.track("another");
  })
  .catch(console.error);
