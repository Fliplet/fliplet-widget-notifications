var Notifications = new Fliplet.Registry.get('fliplet-widget-notifications:1.0:core');

Fliplet.Widget.instance('fliplet-widget-notifications-1-0-0', function (data) {
  var options = {};

  Fliplet.Hooks.run('beforeNotificationsInit', data, options).then(function () {
    var notifications = new Notifications(data);
    notifications.init(options);

    Fliplet.Hooks.run('afterNotificationsInit', notifications);
  });
});