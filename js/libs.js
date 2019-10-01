Fliplet.Registry.set('fliplet-widget-notifications:1.0:core', function (data) {
  var BATCH_SIZE = 20;

  var appId = Fliplet.Env.get('appId');
  var storageKey = 'flAppNotifications';
  var storage;
  var instance;
  var clearNewCountOnUpdate = false;
  var timer;

  function saveCounts(data) {
    data = data || {};

    storage.updatedAt = Date.now();

    if (clearNewCountOnUpdate || !storage.clearedAt) {
      storage.clearedAt = Date.now();
    }

    if (data.hasOwnProperty('unreadCount')) {
      storage.unreadCount = Math.max(0, parseInt(data.unreadCount, 10) || 0);
    }

    if (data.hasOwnProperty('newCount')) {
      storage.newCount = Math.max(0, Math.min(storage.unreadCount, parseInt(data.newCount, 10) || 0));
    }

    return Fliplet.App.Storage.set(storageKey, storage);
  }

  function markAsRead(notifications) {
    return instance.markNotificationsAsRead(notifications)
      .then(function (results) {
        results = results || {};
        affected = results.affected || 0;
        return instance.unread.count();
      })
      .then(function (value) {
        unreadCount = value;
        return saveCounts({
          unreadCount: unreadCount,
          newCount: 0
        });
      })
      .then(function () {
        return Promise.resolve({
          affected: affected,
          unreadCount: unreadCount
        });
      });
  }

  function markAllAsRead() {
    var affected;
    return instance.markNotificationsAsRead('all')
      .then(function (results) {
        results = results || {};
        affected = results.affected || 0;
        return saveCounts({
          unreadCount: 0,
          newCount: 0
        });
      })
      .then(function () {
        return Promise.resolve({
          affected: affected,
          unreadCount: 0
        });
      });
  }

  function addNotificationBadges() {
    if (isNaN(storage.newCount) || storage.newCount <= 0) {
      $('.add-notification-badge')
        .removeClass('has-notification-badge')
        .find('.notification-badge').remove();
      return;
    }

    $('.add-notification-badge')
      .addClass('has-notification-badge')
      .find('.notification-badge').remove().end()
      .append('<div class="notification-badge">' + storage.newCount + '</div>');
  }

  function broadcastCountUpdates() {
    Fliplet.Hooks.run('notificationCountsUpdated', storage);
  }

  function isPolling() {
    return instance.isPolling();
  }

  function poll(options) {
    return instance.poll(options);
  }

  function getNewNotifications(ts) {
    return Promise.all([
      instance.unread.count({ createdAt: { $gt: ts } }),
      instance.unread.count()
    ]);
  }

  function checkForUpdates(ts, opt) {
    var countsUpdated = false;

    if (typeof ts === 'object') {
      opt = ts;
      ts = Date.now();
    }

    ts = ts || Date.now();
    opt = opt || {};

    return getNewNotifications(ts)
      .then(function (counts) {
        var data = {
          updatedAt: Date.now(),
          unreadCount: counts[1],
          newCount: counts[0]
        };
        var comparisonProps = ['unreadCount', 'newCount'];

        countsUpdated = !_.isEqual(_.pick(data, comparisonProps), _.pick(storage, comparisonProps));

        if (clearNewCountOnUpdate) {
          data.newCount = 0;
        }

        return saveCounts(data);
      })
      .then(addNotificationBadges)
      .then(broadcastCountUpdates)
      .then(function () {
        if (!countsUpdated && !opt.forcePolling) {
          return Promise.resolve();
        }

        return poll();
      });
  }

  function checkForUpdatesSinceLastClear() {
    return checkForUpdates(storage.clearedAt || Date.now());
  }

  function setTimer(ms) {
    if (typeof ms === 'undefined') {
      ms = 0;
    }

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    timer = setTimeout(checkForUpdatesSinceLastClear, ms);
  }

  function attachObservers() {
    Fliplet.Hooks.on('pushNotification', function () {
      setTimer(0);
    });
  }

  function init(options) {
    options = options || {};

    clearNewCountOnUpdate = !!options.clearNewCountOnUpdate;

    var defaults = {
      newCount: 0,
      unreadCount: 0
    };

    return Fliplet.App.Storage.get(storageKey, {
      defaults: defaults
    })
      .then(function (value) {
        storage = value;

        instance = Fliplet.Notifications.init({
          batchSize: BATCH_SIZE,
          onFirstResponse: function (err, notifications) {
            Fliplet.Hooks.run('notificationFirstResponse', err, notifications);
          }
        });
        instance.stream(function (notification) {
          Fliplet.Hooks.run('notificationStream', notification);
        });

        Fliplet().then(function () {
          setTimeout(function () {
            // Adding a timeout to allow page JS to modify page DOM first
            addNotificationBadges();
            broadcastCountUpdates();

            if (!storage.updatedAt || options.startCheckingUpdates) {
              setTimer(0);
            }
          }, 0);
        });
      });
  }

  attachObservers();

  return {
    init: init,
    checkForUpdates: checkForUpdates,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    isPolling: isPolling,
    poll: poll
  };
});