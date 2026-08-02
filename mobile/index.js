import "expo-router/entry";

// ponytail: global error handler — error terlihat di logcat
if (ErrorUtils && ErrorUtils.setGlobalHandler) {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error("GLOBAL_ERROR:", error.name, error.message, error.stack);
  });
}
