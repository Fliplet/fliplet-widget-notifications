// Include your namespaced libraries
var Notifications = new Fliplet.Registry.get('fliplet-widget-notifications:1.0:core');

(function () {
  var notifications;

  // This function will run for each instance found in the page
  Fliplet.Widget.instance('fliplet-widget-notifications-1-0-0', function (data) {
    // Sample implementation to initialise the widget
    notifications = new Notifications(data);
    notifications.init();
  });  

  Fliplet.Widget.register('Notifications', function () {
    return notifications;
  });

  Fliplet.Hooks.run('notificationsReady');
})();
