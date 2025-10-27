// --lascripts-event-start="l"

var susy = $.guides.susy({
        columns: 12,
        gutters: 1/6,
        container: 1280,
        debug: {
            image: 'hide',
            color: '#f00000',
            opacity: 20
        }
    });

// --lascripts-event-end="l"


// --lascripts-event-start="r"

var size = prompt('Please enter the container width', 1280),
    susy = size ? $.guides.susy({
        columns: 12,
        gutters: 1/6,
        container: parseInt(size)
    }) : '';

// --lascripts-event-end="r"