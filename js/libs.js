Fliplet.Registry.set('fliplet-widget-notifications:1.0:core', function (data) {
  var BATCH_SIZE = 20;
  var DELAY = 30000;

  var appId = Fliplet.Env.get('appId');
  var updateStorageKey = 'fl_notifications_' + appId;
  var updateStorage;
  var instance;

  function saveUpdates(data) {
    data = data || {};

    updateStorage.updatedAt = data.updatedAt || new Date().getTime();
    if (data.hasOwnProperty('unreadCount')) {
      var unreadCount = 0;
      unreadCount = parseInt(data.unreadCount, 0);
      if (isNaN(unreadCount)) {
        unreadCount = 0;
      }
      unreadCount = Math.max(0, unreadCount);
      updateStorage.unreadCount = unreadCount;
    }

    if (data.hasOwnProperty('newCount')) {
      updateStorage.newCount = Math.min(updateStorage.unreadCount, data.newCount);
    }

    return Fliplet.App.Storage.set(updateStorageKey, updateStorage);
  }

  function addNotificationBadges() {
    if (isNaN(updateStorage.newCount) || updateStorage.newCount <= 0) {
      $('.add-notification-badge')
        .removeClass('has-notification-badge')
        .find('.notification-badge').remove();
      return;
    }

    $('.add-notification-badge')
      .addClass('has-notification-badge')
      .find('.notification-badge').remove().end()
      .append('<div class="notification-badge">' + updateStorage.newCount + '</div>');
  }

  function broadcastUpdates() {
    Fliplet.Hooks.run('notificationsUpdated', updateStorage);
  }

  function setTimer(ms) {
    if (typeof ms === 'undefined') {
      ms = 0;
    }

    setTimeout(checkForUpdates, ms);
  }

  function createUpdateTimer() {
    var diff = new Date().getTime() - updateStorage.updatedAt;
    if (diff > DELAY) {
      setTimer(0);
      return;
    }

    //Set the timer with the remaining time
    setTimer(DELAY - diff);
  }

  function getNewNotifications(ts) {
    return Promise.all([
      instance.unread.count(ts ? ts : updateStorage.updatedAt),
      instance.unread.count()
    ]);
  }

  function checkForUpdates(ts) {
    return getNewNotifications(ts)
      .then(function (counts) {
        var newCountSinceUpdatedAt = counts[0];
        var unreadCount = counts[1];
        var data = {
          unreadCount: unreadCount,
          newCount: updateStorage.newCount + newCountSinceUpdatedAt
        };

        if (ts) {
          data.updatedAt = ts;
        }

        return saveUpdates(data);
      })
      .then(createUpdateTimer)
      .then(addNotificationBadges)
      .then(broadcastUpdates);
  }

  function init() {
    var timeNow = new Date().getTime();
    var defaults = {
      updatedAt: timeNow,
      newCount: 0,
      unreadCount: 0
    };

    Fliplet.Hooks.on('checkNotifications', checkForUpdates);
    instance = Fliplet.Notifications.init();

    return Fliplet.App.Storage.get(updateStorageKey, {
      defaults: defaults
    })
      .then(function (value) {
        updateStorage = value;
        setTimeout(function () {
          // Adding a timeout to allow page JS to modify page DOM
          addNotificationBadges();
          broadcastUpdates();          
        }, 0);

        if (updateStorage.updatedAt === timeNow) {
          setTimer(0);
        } else {
          createUpdateTimer();
        }

        return Promise.resolve();
      });
  }

  return {
    init: init,
    checkForUpdates: checkForUpdates,
    saveUpdates: saveUpdates
  };
});