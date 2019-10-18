var Notifications = new Fliplet.Registry.get('fliplet-widget-notifications:1.0:core');

// Wait for sync hooks to register
Fliplet().then(function () {
  Fliplet.Widget.instance('fliplet-widget-notifications-1-0-0', function (data) {
    var options = {};

    Fliplet.Notifications.Scopes.get().then(function (scope) {
      data.scope = scope;
      
      Fliplet.Hooks.run('beforeNotificationsInit', data, options).then(function () {
        var notifications = new Notifications(data);
        notifications.init(options);
      });
    });
  });
});