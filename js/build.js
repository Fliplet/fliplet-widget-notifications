// Include your namespaced libraries
var Notifications = new Fliplet.Registry.get('fliplet-widget-notifications:1.0:core');

(function () {
  var notifications;

  // This function will run for each instance found in the page
  Fliplet.Widget.instance('fliplet-widget-notifications-1-0-0', function (data) {
    // Sample implementation to initialize the widget
    notifications = new Notifications(data);
  });

  Fliplet.Widget.register('Notifications', function () {
    return notifications;
  });

  Fliplet.Hooks.run('beforeNotificationsInit')
    .then(notifications.init)
    .catch(function (err) {
      if (err) {
        console.warn(err);
      }
    });
})();
