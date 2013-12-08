// array functions

Array.prototype.customFirst = function (delegate) {
    if (delegate) {
        for (var i = 0; i < this.length; i++) {
            if (delegate(this[i], i)) {
                return this[i];
            }
        }
    }

    return undefined;
}

Array.prototype.customLast = function (delegate)
{
    if (arguments.length == 0)
    {
        return this[this.length - 1];
    }

    for (var i = this.length - 1; i > 0 ; i--)
    {
        if (delegate(this[i], i))
        {
            return this[i];
        }
    }

    return null;
}

// city slider

function CitySlider ($element, onSlideSelected) {

	this.moveOnOneSlide = moveOnOneSlide;
	this.selectSlide = selectSlide;

	onSlideSelected = onSlideSelected || function () {};

    var $mask = $element;
    var $wrapper = $element.find('ul');  
    var selectedClassName = "active"; 

    function getSlides()
    {
        return $element.find('ul li');
    }        

    function getSlidesVisibility() {
        var slidesWidthSum = 0;
        var slidesVisibility = [];
        var wrapperLeftOffset = parseInt($wrapper.css('left')) || 0;

        var nextIsFullyVisible = Math.abs(wrapperLeftOffset) == 0;
        var nextIsFullyInvisible = false;
        var previousItemVisibility = 'invisible';

        getSlides().each(function () {
            var slide = $(this);
            slidesWidthSum += slide.outerWidth();

            var visibility = 'invisible';
            var invisiblePartSize = 0;

            if (Math.abs(wrapperLeftOffset) < slidesWidthSum 
                && slidesWidthSum <= Math.abs(wrapperLeftOffset) + $mask.width())
            {
                if (nextIsFullyVisible || previousItemVisibility != 'invisible')
                {
                    visibility = 'fullyVisible';
                }
                else
                {
                    // front
                    visibility = 'partiallyVisible';
                    invisiblePartSize = slide.outerWidth() - (slidesWidthSum + wrapperLeftOffset);
                }
            }
            else if (slidesWidthSum > Math.abs(wrapperLeftOffset) + $mask.width()
                && previousItemVisibility == 'fullyVisible' && !nextIsFullyInvisible)
            {
                //back
                visibility = 'partiallyVisible';
                invisiblePartSize = slidesWidthSum - (Math.abs(wrapperLeftOffset) + $mask.width());
            }
            
            slidesVisibility.push({
                slide: slide,
                visibility: visibility,
                invisiblePartSize: invisiblePartSize
            });

            nextIsFullyVisible = Math.abs(wrapperLeftOffset) == slidesWidthSum;
            nextIsFullyInvisible = Math.abs(wrapperLeftOffset) + $mask.width() == slidesWidthSum;

            previousItemVisibility = visibility;

        });

        return slidesVisibility;
    }

    function moveOnOneSlide(direction, callback, duration) {
        var slidesVisibilityInfo = getSlidesVisibility();

        var visibleSlideInfo = slidesVisibilityInfo[direction < 0 ? 'customFirst' : 'customLast'](function (s) { 
            return s.visibility == 'partiallyVisible' 
                || s.visibility == 'fullyVisible';
        });

        var offset = getOffsetToMove(visibleSlideInfo, direction);

        moveWrapper((direction < 0 ? 1 : -1) * offset, 
            function () { 
                if (callback) {
                    callback();
                }

                checkSelectedSlide(direction); 
            },
            duration);
    }

    function getOffsetToMove(visibleSlideInfo, direction)
    {
        var offset = 0;

        if (visibleSlideInfo.visibility == 'partiallyVisible')
        {
            if (visibleSlideInfo.invisiblePartSize >= 10)
            {
                return visibleSlideInfo.invisiblePartSize;
            }
            else
            {
                offset += visibleSlideInfo.invisiblePartSize;
            }
        }

        var nextElement = visibleSlideInfo.slide[direction < 0 ? 'prev' : 'next']();

        if (nextElement.length == 0)
        {
            nextElement = getSlides()[direction < 0 ? 'last' : 'first']();
            nextElement[direction < 0 ? 'insertBefore' : 'insertAfter'](visibleSlideInfo.slide);

            $wrapper.css('left', (parseInt($wrapper.css('left')) || 0) + (direction < 0 ? -1 : 1) * nextElement.outerWidth() + 'px');

        }

        offset += nextElement.outerWidth();
        return offset;
    }

    function checkSelectedSlide(direction)
    {
        var slidesVisibilityInfo = getSlidesVisibility();

        var selectedSlideInfo = slidesVisibilityInfo.customFirst(function (slideInfo) { 
            return slideInfo.slide.hasClass(selectedClassName); 
        });

        var paddingSize = 10;

        if ( selectedSlideInfo.visibility == 'fullyVisible' 
            || ( selectedSlideInfo.visibility == 'partiallyVisible' && selectedSlideInfo.invisiblePartSize < paddingSize) )
        {
            return;
        }

        var edgeSlideInfo = slidesVisibilityInfo[direction < 0 ? 'customLast' : 'customFirst'](function (s) { 
            return s.visibility == 'partiallyVisible' 
                || s.visibility == 'fullyVisible';
        });

        var slideToSelect = edgeSlideInfo.slide;

        if (edgeSlideInfo.visibility == 'partiallyVisible' && edgeSlideInfo.invisiblePartSize >= paddingSize)
        {
            slideToSelect = edgeSlideInfo.slide[direction < 0 ? 'prev' : 'next']();
        }

        slideToSelect.addClass(selectedClassName);
        selectedSlideInfo.slide.removeClass(selectedClassName);
        raiseSlideSelectedEvent(slideToSelect)
    }

    var slideSelectRaiseTimeout;

    function raiseSlideSelectedEvent(selectedSlide)
    {
    	clearTimeout(slideSelectRaiseTimeout);

    	setTimeout(function () {
    		onSlideSelected(selectedSlide);
    	}, 50);
    }

    function moveWrapper(offset, callback, duration)
    {
        $wrapper.animate(
            {
                'left': (parseInt($wrapper.css('left')) || 0) + offset + 'px'
            }, 
            duration || 200, 
            callback);

        // $wrapper.css('left', (parseInt($wrapper.css('left')) || 0) + offset + 'px');
    }

    function selectSlide(target)
    {
        getSlides().removeClass(selectedClassName);
        target.addClass(selectedClassName);
        raiseSlideSelectedEvent(target);

        var slidesInfo = getSlidesVisibility();

        var direction;
        var targetInfo;
        var wasWindow = false;

        for (var i = 0; i < slidesInfo.length; i++)
        {
            if (slidesInfo[i].visibility != 'invisible')
            {
                wasWindow = true;
            }

            if (slidesInfo[i].slide[0] == target[0])
            {
                targetInfo = slidesInfo[i];

                direction = i > 0 && wasWindow
                    ? 1 
                    : -1;

                break;
            }
        }

        if (targetInfo.visibility == 'fullyVisible')
        {
            return;
        }

        if (targetInfo.visibility == 'partiallyVisible')
        {
            moveOnOneSlide(direction);
            return;
        }

        moveUntilSlideIsNotVisible(target, direction);
    }

    function moveUntilSlideIsNotVisible($slide, direction)
    {
        var slidesInfo = getSlidesVisibility();

        var targetInfo = slidesInfo.customFirst(function (slideInfo) {
            return slideInfo.slide[0] == $slide[0];
        });

        if (targetInfo.visibility == 'fullyVisible')
        {
            getSlides().removeClass(selectedClassName);
            $slide.addClass(selectedClassName);
            raiseSlideSelectedEvent($slide);

            return;
        }

        moveOnOneSlide(direction, function () { moveUntilSlideIsNotVisible($slide, direction); }, 200 / getSlides().length);
    }
}