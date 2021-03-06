// ==========================================================================
// Project:   SproutCore
// Copyright: @2013 7x7 Software, Inc.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


// This adds transition engine constants to SC.ContainerView.
SC.mixin(SC.ContainerView,
/** @scope SC.ContainerView.prototype */ {

  /** @class
    Provides dissolve transitions to SC.ContainerView.  The new content will
    fade in as the old content fades out of the view.

    To modify the dissolve animation, you can set the following transition
    options:

      - duration {Number} the number of seconds for the animation.  Default: 0.4
      - timing {String} the animation timing function.  Default: 'ease'

    @extends SC.TransitionProtocol
    @see SC.View#animate for other timing functions.
    @since Version 1.10
  */
  DISSOLVE: {

    /** @private */
    willBuildInToView: function (container, content, previousStatechart, options) {
      content.adjust({ opacity: 0 });
    },

    /** @private */
    buildInToView: function (statechart, container, content, previousStatechart, options) {
      content.animate('opacity', 1, {
        duration: options.duration || 0.4,
        timing: options.timing || 'ease'
      }, function (data) {
        // We may already be in exiting state by the time we transition in.
        if (statechart.get('state') === 'entering') {
          statechart.entered();
        }
      });
    },

    /** @private */
    buildOutFromView: function (statechart, container, content, options, exitCount) {
      // We can call this transition repeatedly without effecting the current exit transition.
      if (exitCount == 1) {
        // Fade the current content at the same time.
        content.animate('opacity', 0, {
          duration: options.duration || 0.4,
          timing: options.timing || 'ease'
        }, function (data) {
          statechart.exited();
        });
      }
    },

    /** @private */
    didBuildOutFromView: function (container, content, options) {
      // Reset the opacity in case this view is used elsewhere.
      content.adjust({ opacity: 1 });
    }

  },

  /** @class
    Provides fade through color transitions to SC.ContainerView.  The old
    content will fade out to a color and the new content will then fade in.

    To modify the fade through color animation, you can set the following
    transition options:

      - color {String} any valid CSS Color.  Default: 'black'
      - duration {Number} the number of seconds for the animation.  Default: 0.4
      - timing {String} the animation timing function.  Default: 'ease'

    @extends SC.TransitionProtocol
    @see SC.View#animate for other timing functions.
    @since Version 1.10
  */
  FADE_COLOR: {

    /** @private */
    willBuildInToView: function (container, content, previousStatechart, options) {
      var color,
        colorView;

      content.adjust({ opacity: 0 });

      // Create a color view to fade through.
      color = SC.Color.from(options.color || 'black');
      colorView = SC.View.create({
        layout: { opacity: 0, zIndex: 1 },
        render: function (context) {
          context.addStyle('background-color', color.get('cssText'));
        }
      });
      container.appendChild(colorView);
    },

    /** @private */
    buildInToView: function (statechart, container, content, previousStatechart, options) {
      var childViews = container.get('childViews'),
        colorView;

      colorView = childViews.objectAt(childViews.get('length') - 1);

      // Fade the color in (uses half the total duration)
      colorView.animate('opacity', 1, {
        duration: options.duration * 0.5 || 0.4,
        timing: options.timing || 'ease-in'
      }, function () {
        // Show new content, then fade the color out.
        content.adjust('opacity', 1);

        colorView.animate('opacity', 0, {
          duration: options.duration * 0.5 || 0.4,
          timing: options.timing || 'ease-in'
        }, function (data) {
          // It's best to clean up the colorView here rather than try to find it again on teardown,
          // since multiple color views could be added.
          container.removeChild(this);
          this.destroy();

          // We may already be in exiting state by the time we transition in.
          if (statechart.get('state') === 'entering') {
            statechart.entered();
          }
        });
      });
    }

  },


  /** @class
    Provides move in transitions to SC.ContainerView.  The new content will
    move in over top of the old content.

    To modify the move in animation, you can set the following transition
    options:

      - direction {String} the direction to move new content in.  Default: 'left'.
        ** 'left' - moves new content from the right to the left
        ** 'right' - moves new content from the left to the right
        ** 'up' - moves new content from the bottom to the top
        ** 'down' - moves new content from the top to the bottom
      - duration {Number} the number of seconds for the animation.  Default: 0.4
      - timing {String} the animation timing function.  Default: 'ease'

    @extends SC.TransitionProtocol
    @see SC.View#animate for other timing functions.
    @since Version 1.10
  */
  MOVE_IN: {

    /** @private */
    willBuildInToView: function (container, content, previousStatechart, options) {
      var frame = container.get('frame'),
        left,
        top,
        height,
        width;

      height = frame.height;
      width = frame.width;

      switch (options.direction) {
      case 'right':
        left = -width;
        break;
      case 'up':
        top = height;
        break;
      case 'down':
        top = -height;
        break;
      default:
        left = width;
      }

      content.adjust({ bottom: null, left: left || 0, right: null, top: top || 0, height: height, width: width });
    },

    /** @private */
    buildInToView: function (statechart, container, content, previousStatechart, options) {
      var key,
        value;

      switch (options.direction) {
      case 'right':
        key = 'left';
        break;
      case 'up':
        key = 'top';
        break;
      case 'down':
        key = 'top';
        break;
      default:
        key = 'left';
      }

      content.animate(key, 0, {
        duration: options.duration || 0.4,
        timing: options.timing || 'ease'
      }, function (data) {
        // We may already be in exiting state by the time we transition in.
        if (statechart.get('state') === 'entering') {
          statechart.entered();
        }
      });
    },

    /** @private */
    didBuildInToView: function (container, content, options) {
      // Convert to a flexible layout.
      content.adjust({ bottom: 0, right: 0, height: null, width: null });
    },

    /** @private */
    didBuildOutFromView: function (container, content, options) {
      // Convert to a flexible layout (in case we never fully entered).
      content.adjust({ bottom: 0, right: 0, height: null, width: null });
    }
  },

  /** @class
    Provides push transitions to SC.ContainerView.  The new content will push
    the old content out of the view.

    To modify the push animation, you can set the following transition options:

      - direction {String} the direction to push new content in.  Default: 'left'
        ** 'left' - pushes new content from the right to the left
        ** 'right' - pushes new content from the left to the right
        ** 'up' - pushes new content from the bottom to the top
        ** 'down' - pushes new content from the top to the bottom
      - duration {Number} the number of seconds for the animation.  Default: 0.4
      - timing {String} the animation timing function.  Default: 'ease'

    @extends SC.TransitionProtocol
    @see SC.View#animate for other timing functions.
    @since Version 1.10
  */
  PUSH: {

    /** @private */
    willBuildInToView: function (container, content, previousStatechart, options) {
      var adjustLeft = 0,
        adjustTop = 0,
        frame = container.get('frame'),
        left = 0,
        top = 0,
        height,
        width;

      height = frame.height;
      width = frame.width;

      // Push on to the edge of whatever the current position of previous content is.
      if (previousStatechart && previousStatechart.get('content')) {
        var adjustments = previousStatechart.getPath('content.liveAdjustments');

        adjustLeft = adjustments.left || 0;
        adjustTop = adjustments.top || 0;
      }

      switch (options.direction) {
      case 'right':
        left = -width + adjustLeft;
        break;
      case 'up':
        top = height + adjustTop;
        break;
      case 'down':
        top = -height + adjustTop;
        break;
      default:
        left = width + adjustLeft;
      }

      // Convert to an animatable layout.
      content.adjust({ bottom: null, right: null, left: left, top: top, height: height, width: width });
    },

    /** @private */
    buildInToView: function (statechart, container, content, previousStatechart, options) {
      var key;

      switch (options.direction) {
      case 'up':
        key = 'top';
        break;
      case 'down':
        key = 'top';
        break;
      default:
        key = 'left';
      }

      content.animate(key, 0, {
        duration: options.duration || 0.4,
        timing: options.timing || 'ease'
      }, function (data) {
        // We may already be in exiting state by the time we transition in.
        if (statechart.get('state') === 'entering') {
          statechart.entered();
        }
      });
    },

    /** @private */
    didBuildInToView: function (container, content, options) {
      // Convert to a flexible layout.
      content.adjust({ bottom: 0, right: 0, height: null, width: null });
    },

    /** @private */
    willBuildOutFromView: function (container, content, options) {
      var frame = container.get('frame'),
        height,
        width;

      height = frame.height;
      width = frame.width;

      // Convert to an animatable layout.
      content.adjust({ bottom: null, right: null, height: height, width: width });
    },

    /** @private */
    buildOutFromView: function (statechart, container, content, options, exitCount) {
      var frame = container.get('frame'),
        key,
        value;

      switch (options.direction) {
      case 'right':
        key = 'left';
        value = frame.width;
        break;
      case 'up':
        key = 'top';
        value = -frame.height;
        break;
      case 'down':
        key = 'top';
        value = frame.height;
        break;
      default:
        key = 'left';
        value = -frame.width;
      }

      content.animate(key, value * exitCount, {
        duration: options.duration || 0.4,
        timing: options.timing || 'ease'
      }, function (data) {
        if (!data.isCancelled) {
          statechart.exited();
        }
      });
    },

    /** @private */
    didBuildOutFromView: function (container, content, options) {
      // Convert to a flexible layout.
      content.adjust({ bottom: 0, right: 0, height: null, width: null });
    },

    /** @private */
    transitionClippingFrame: function (container, clippingFrame, options) {
      var frame = container.get('frame');

      switch (options.direction) {
      case 'right':
        clippingFrame.width = frame.width * 2;
        clippingFrame.x = -frame.width;
        break;
      case 'up':
        clippingFrame.height = frame.height * 2;
        clippingFrame.y = -frame.height;
        break;
      case 'down':
        clippingFrame.height = frame.height * 2;
        clippingFrame.y = 0;
        break;
      default:
        clippingFrame.width = frame.width * 2;
        clippingFrame.x = 0;
      }

      return clippingFrame;
    }
  },

  /** @class
    Provides reveal transitions to SC.ContainerView.  The old content will
    move out revealing the new content underneath.

    To modify the reveal animation, you can set the following transition
    options:

      - direction {String} The direction to move old content off.  Default: 'left'
        ** 'left' - moves old content off to the left
        ** 'right' - moves old content off to the right
        ** 'up' - moves old content off to the top
        ** 'down' - moves old content off to the bottom
      - duration {Number} the number of seconds for the animation.  Default: 0.4
      - timing {String} the animation timing function.  Default: 'ease'

    @extends SC.TransitionProtocol
    @see SC.View#animate for other timing functions.
    @since Version 1.10
  */
  REVEAL: {

    /** @private */
    willBuildOutFromView: function (container, content, options, exitCount) {
      var frame = container.get('frame'),
        height,
        width;

      height = frame.height;
      width = frame.width;

      // Convert to a fixed layout. Put this view on top.
      content.adjust({ bottom: null, right: null, height: height, width: width, zIndex: exitCount });
    },

    /** @private */
    buildOutFromView: function (statechart, container, content, options, exitCount) {
      // We can call this transition repeatedly without effecting the current exit transition.
      if (exitCount === 1) {
        var frame = container.get('frame'),
          key,
          value;

        switch (options.direction) {
        case 'right':
          key = 'left';
          value = -frame.width;
          break;
        case 'up':
          key = 'top';
          value = -frame.height;
          break;
        case 'down':
          key = 'top';
          value = frame.height;
          break;
        default:
          key = 'left';
          value = frame.width;
        }

        content.animate(key, value, {
          duration: options.duration || 0.4,
          timing: options.timing || 'ease'
        }, function (data) {
          if (!data.isCancelled) {
            statechart.exited();
          }
        });
      }
    },

    /** @private */
    didBuildOutFromView: function (container, content, options) {
      // Convert to a flexible layout.
      content.adjust({ bottom: 0, right: 0, height: null, width: null, zIndex: null });
    }

  }

});
