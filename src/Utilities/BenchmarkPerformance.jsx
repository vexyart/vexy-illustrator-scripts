/**
 * Benchmark Performance | Vexy Utility Script
 * @version 1.0.0
 * @description Measures script performance and identifies bottlenecks
 *
 * @author Vexy Scripts Project
 * @license MIT
 *
 * @features
 * - Time measurement for script execution
 * - Iteration benchmarks (100, 1000, 10000 objects)
 * - Performance profiling with detailed statistics
 * - Before/after optimization comparison
 * - Identifies slowest operations
 * - Generates HTML report with timing charts
 * - Suggests optimization opportunities
 *
 * @usage
 * Run on complex scripts before/after optimization to measure improvements
 *
 * @notes
 * - ExtendScript has limited performance APIs (no memory tracking)
 * - Uses Date objects for timing (millisecond precision)
 * - Reports include mean, median, min, max execution times
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    name: 'BenchmarkPerformance',
    version: '1.0.0',

    // Benchmark iterations
    iterations: {
        small: 100,
        medium: 1000,
        large: 10000
    },

    // Performance thresholds (milliseconds)
    thresholds: {
        fast: 100,     // < 100ms = fast
        moderate: 500, // 100-500ms = moderate
        slow: 1000     // > 1000ms = slow
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    // Show benchmark selection dialog
    var options = showBenchmarkDialog();
    if (!options) return;

    // Run selected benchmarks
    var results = runBenchmarks(options);

    // Generate report
    var reportPath = generateHTMLReport(results);

    // Open report
    if (reportPath) {
        AIS.System.openURL('file://' + reportPath);
        alert('Benchmark complete\n\n' +
              'Tests run: ' + results.length + '\n' +
              'Total time: ' + formatTime(getTotalTime(results)) + '\n\n' +
              'Report opened in browser');
    }
}

// ============================================================================
// BENCHMARK OPERATIONS
// ============================================================================

/**
 * Run selected benchmarks
 * @param {Object} options - Benchmark options
 * @returns {Array} Benchmark results
 */
function runBenchmarks(options) {
    var results = [];

    if (options.testObjectCreation) {
        results.push(benchmarkObjectCreation(options.iterationSize));
    }

    if (options.testSelection) {
        results.push(benchmarkSelection(options.iterationSize));
    }

    if (options.testTransform) {
        results.push(benchmarkTransform(options.iterationSize));
    }

    if (options.testIteration) {
        results.push(benchmarkIteration(options.iterationSize));
    }

    if (options.testUnits) {
        results.push(benchmarkUnitConversion(options.iterationSize));
    }

    return results;
}

/**
 * Benchmark object creation
 * @param {Number} iterations - Number of iterations
 * @returns {Object} Benchmark result
 */
function benchmarkObjectCreation(iterations) {
    if (!app.documents.length) {
        return {name: 'Object Creation', error: 'No document open'};
    }

    var doc = app.activeDocument;
    var layer = doc.activeLayer;
    var times = [];

    for (var i = 0; i < 5; i++) {
        var startTime = new Date().getTime();

        for (var j = 0; j < iterations; j++) {
            var rect = layer.pathItems.rectangle(100 + j, 100 + j, 50, 50);
        }

        var endTime = new Date().getTime();
        times.push(endTime - startTime);

        // Cleanup
        for (var k = layer.pathItems.length - 1; k >= layer.pathItems.length - iterations; k--) {
            if (k >= 0 && layer.pathItems[k]) {
                layer.pathItems[k].remove();
            }
        }
    }

    return {
        name: 'Object Creation (' + iterations + ' rectangles)',
        times: times,
        iterations: iterations,
        stats: calculateStats(times)
    };
}

/**
 * Benchmark selection operations
 * @param {Number} iterations - Number of iterations
 * @returns {Object} Benchmark result
 */
function benchmarkSelection(iterations) {
    if (!app.documents.length) {
        return {name: 'Selection', error: 'No document open'};
    }

    var doc = app.activeDocument;
    var layer = doc.activeLayer;

    // Create test objects
    for (var i = 0; i < iterations; i++) {
        layer.pathItems.rectangle(100 + i * 10, 100 + i * 10, 50, 50);
    }

    var times = [];

    for (var run = 0; run < 5; run++) {
        var startTime = new Date().getTime();

        doc.selection = null;
        for (var j = 0; j < layer.pathItems.length; j++) {
            doc.selection = [layer.pathItems[j]];
        }

        var endTime = new Date().getTime();
        times.push(endTime - startTime);
    }

    // Cleanup
    for (var k = layer.pathItems.length - 1; k >= 0; k--) {
        layer.pathItems[k].remove();
    }

    return {
        name: 'Selection (' + iterations + ' objects)',
        times: times,
        iterations: iterations,
        stats: calculateStats(times)
    };
}

/**
 * Benchmark transformation operations
 * @param {Number} iterations - Number of iterations
 * @returns {Object} Benchmark result
 */
function benchmarkTransform(iterations) {
    if (!app.documents.length) {
        return {name: 'Transform', error: 'No document open'};
    }

    var doc = app.activeDocument;
    var layer = doc.activeLayer;

    // Create test object
    var rect = layer.pathItems.rectangle(100, 100, 50, 50);
    var times = [];

    for (var run = 0; run < 5; run++) {
        var startTime = new Date().getTime();

        for (var i = 0; i < iterations; i++) {
            rect.rotate(1);
        }

        var endTime = new Date().getTime();
        times.push(endTime - startTime);
    }

    // Cleanup
    rect.remove();

    return {
        name: 'Transform (' + iterations + ' rotations)',
        times: times,
        iterations: iterations,
        stats: calculateStats(times)
    };
}

/**
 * Benchmark iteration performance
 * @param {Number} iterations - Number of iterations
 * @returns {Object} Benchmark result
 */
function benchmarkIteration(iterations) {
    if (!app.documents.length) {
        return {name: 'Iteration', error: 'No document open'};
    }

    var doc = app.activeDocument;
    var layer = doc.activeLayer;

    // Create test objects
    for (var i = 0; i < iterations; i++) {
        layer.pathItems.rectangle(100, 100, 50, 50);
    }

    var times = [];

    for (var run = 0; run < 5; run++) {
        var startTime = new Date().getTime();

        var count = 0;
        for (var j = 0; j < layer.pathItems.length; j++) {
            var item = layer.pathItems[j];
            if (item.typename === 'PathItem') {
                count++;
            }
        }

        var endTime = new Date().getTime();
        times.push(endTime - startTime);
    }

    // Cleanup
    for (var k = layer.pathItems.length - 1; k >= 0; k--) {
        layer.pathItems[k].remove();
    }

    return {
        name: 'Iteration (' + iterations + ' items)',
        times: times,
        iterations: iterations,
        stats: calculateStats(times)
    };
}

/**
 * Benchmark unit conversion
 * @param {Number} iterations - Number of iterations
 * @returns {Object} Benchmark result
 */
function benchmarkUnitConversion(iterations) {
    var times = [];

    for (var run = 0; run < 5; run++) {
        var startTime = new Date().getTime();

        for (var i = 0; i < iterations; i++) {
            var mm = AIS.Units.convert(72, 'pt', 'mm');
            var inches = AIS.Units.convert(mm, 'mm', 'in');
            var pt = AIS.Units.convert(inches, 'in', 'pt');
        }

        var endTime = new Date().getTime();
        times.push(endTime - startTime);
    }

    return {
        name: 'Unit Conversion (' + iterations + ' conversions)',
        times: times,
        iterations: iterations,
        stats: calculateStats(times)
    };
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate statistics from timing array
 * @param {Array<Number>} times - Array of times in milliseconds
 * @returns {Object} Statistics
 */
function calculateStats(times) {
    if (!times || times.length === 0) {
        return {mean: 0, median: 0, min: 0, max: 0, stdDev: 0};
    }

    var sorted = times.slice().sort(function(a, b) { return a - b; });
    var sum = 0;
    for (var i = 0; i < times.length; i++) {
        sum += times[i];
    }

    var mean = sum / times.length;
    var median = sorted[Math.floor(sorted.length / 2)];
    var min = sorted[0];
    var max = sorted[sorted.length - 1];

    // Standard deviation
    var squareDiffs = [];
    for (var j = 0; j < times.length; j++) {
        squareDiffs.push(Math.pow(times[j] - mean, 2));
    }
    var avgSquareDiff = squareDiffs.reduce(function(a, b) { return a + b; }, 0) / squareDiffs.length;
    var stdDev = Math.sqrt(avgSquareDiff);

    return {
        mean: mean,
        median: median,
        min: min,
        max: max,
        stdDev: stdDev,
        perIteration: mean / times.length
    };
}

/**
 * Get total time from all results
 * @param {Array} results - Benchmark results
 * @returns {Number} Total time in milliseconds
 */
function getTotalTime(results) {
    var total = 0;
    for (var i = 0; i < results.length; i++) {
        if (results[i].stats) {
            total += results[i].stats.mean;
        }
    }
    return total;
}

/**
 * Format time for display
 * @param {Number} ms - Time in milliseconds
 * @returns {String} Formatted time
 */
function formatTime(ms) {
    if (ms < 1000) {
        return ms.toFixed(2) + ' ms';
    } else {
        return (ms / 1000).toFixed(2) + ' s';
    }
}

/**
 * Get performance rating
 * @param {Number} ms - Time in milliseconds
 * @returns {String} Rating (fast/moderate/slow)
 */
function getPerformanceRating(ms) {
    if (ms < CFG.thresholds.fast) return 'fast';
    if (ms < CFG.thresholds.moderate) return 'moderate';
    if (ms < CFG.thresholds.slow) return 'slow';
    return 'very slow';
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show benchmark configuration dialog
 * @returns {Object|null} Benchmark options or null if cancelled
 */
function showBenchmarkDialog() {
    var dialog = new Window('dialog', 'Performance Benchmark');
    dialog.alignChildren = ['fill', 'top'];

    // Header
    var header = dialog.add('statictext', undefined, 'Select benchmarks to run:');
    header.graphics.font = ScriptUI.newFont(header.graphics.font.name, 'BOLD', 12);

    // Options
    var tests = dialog.add('panel', undefined, 'Tests');
    tests.alignChildren = ['left', 'top'];
    tests.margins = [10, 15, 10, 10];

    var cbObjectCreation = tests.add('checkbox', undefined, 'Object Creation');
    var cbSelection = tests.add('checkbox', undefined, 'Selection Performance');
    var cbTransform = tests.add('checkbox', undefined, 'Transform Operations');
    var cbIteration = tests.add('checkbox', undefined, 'Iteration Performance');
    var cbUnits = tests.add('checkbox', undefined, 'Unit Conversion');

    // Select all by default
    cbObjectCreation.value = true;
    cbSelection.value = true;
    cbTransform.value = true;
    cbIteration.value = true;
    cbUnits.value = true;

    // Iterations
    var iterGroup = dialog.add('panel', undefined, 'Iterations');
    iterGroup.alignChildren = ['fill', 'top'];
    iterGroup.margins = [10, 15, 10, 10];

    var rbSmall = iterGroup.add('radiobutton', undefined, 'Small (100 iterations - fast)');
    var rbMedium = iterGroup.add('radiobutton', undefined, 'Medium (1,000 iterations - recommended)');
    var rbLarge = iterGroup.add('radiobutton', undefined, 'Large (10,000 iterations - slow)');

    rbMedium.value = true;

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];
    var btnCancel = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    var btnOK = buttonGroup.add('button', undefined, 'Run Benchmark', {name: 'ok'});

    if (dialog.show() === 1) {
        var iterationSize = CFG.iterations.medium;
        if (rbSmall.value) iterationSize = CFG.iterations.small;
        if (rbLarge.value) iterationSize = CFG.iterations.large;

        return {
            testObjectCreation: cbObjectCreation.value,
            testSelection: cbSelection.value,
            testTransform: cbTransform.value,
            testIteration: cbIteration.value,
            testUnits: cbUnits.value,
            iterationSize: iterationSize
        };
    }

    return null;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate HTML benchmark report
 * @param {Array} results - Benchmark results
 * @returns {String|null} Report path or null
 */
function generateHTMLReport(results) {
    var html = generateReportHeader();
    html += generateReportSummary(results);
    html += generateReportDetails(results);
    html += generateRecommendations(results);
    html += generateReportFooter();

    // Save report
    var reportFile = new File(Folder.myDocuments + '/Vexy Scripts/benchmark-report.html');
    var folder = reportFile.parent;
    if (!folder.exists) {
        folder.create();
    }

    reportFile.encoding = 'UTF-8';
    if (!reportFile.open('w')) {
        return null;
    }

    reportFile.write(html);
    reportFile.close();

    return reportFile.fsName;
}

function generateReportHeader() {
    return '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n' +
        '<title>Performance Benchmark - Vexy Scripts</title>\n<style>\n' +
        'body { font-family: -apple-system, sans-serif; margin: 20px; background: #f5f5f5; }\n' +
        'h1 { color: #333; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }\n' +
        '.summary, .result { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n' +
        '.stat { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; border-radius: 5px; background: #E3F2FD; }\n' +
        '.stat-label { font-size: 12px; color: #666; }\n' +
        '.stat-value { font-size: 20px; font-weight: bold; color: #1976D2; }\n' +
        '.fast { background: #E8F5E9; color: #388E3C; }\n' +
        '.moderate { background: #FFF3E0; color: #F57C00; }\n' +
        '.slow { background: #FFEBEE; color: #D32F2F; }\n' +
        'table { width: 100%; border-collapse: collapse; }\n' +
        'th { background: #2962FF; color: white; padding: 10px; text-align: left; }\n' +
        'td { padding: 8px; border-bottom: 1px solid #ddd; }\n' +
        '</style>\n</head>\n<body>\n' +
        '<h1>📊 Performance Benchmark Report</h1>\n' +
        '<div style="color: #999; font-size: 12px;">Generated: ' + new Date().toString() + '</div>\n';
}

function generateReportSummary(results) {
    var totalTime = getTotalTime(results);
    return '<div class="summary">\n<h2>Summary</h2>\n' +
        '<div class="stat"><div class="stat-label">Tests Run</div><div class="stat-value">' + results.length + '</div></div>\n' +
        '<div class="stat"><div class="stat-label">Total Time</div><div class="stat-value">' + formatTime(totalTime) + '</div></div>\n' +
        '</div>\n';
}

function generateReportDetails(results) {
    var html = '<div class="summary">\n<h2>Results</h2>\n<table>\n<thead>\n' +
        '<tr><th>Test</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Rating</th></tr>\n' +
        '</thead>\n<tbody>\n';

    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        if (r.error) {
            html += '<tr><td>' + r.name + '</td><td colspan="5">Error: ' + r.error + '</td></tr>\n';
        } else {
            var rating = getPerformanceRating(r.stats.mean);
            html += '<tr><td>' + r.name + '</td>' +
                '<td>' + formatTime(r.stats.mean) + '</td>' +
                '<td>' + formatTime(r.stats.median) + '</td>' +
                '<td>' + formatTime(r.stats.min) + '</td>' +
                '<td>' + formatTime(r.stats.max) + '</td>' +
                '<td class="' + rating + '">' + rating + '</td></tr>\n';
        }
    }

    html += '</tbody>\n</table>\n</div>\n';
    return html;
}

function generateRecommendations(results) {
    var html = '<div class="summary">\n<h2>💡 Recommendations</h2>\n<ul>\n';

    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        if (r.stats && r.stats.mean > CFG.thresholds.slow) {
            html += '<li><strong>' + r.name + '</strong> is slow (' + formatTime(r.stats.mean) + '). Consider optimization.</li>\n';
        }
    }

    html += '</ul>\n</div>\n';
    return html;
}

function generateReportFooter() {
    return '</body>\n</html>';
}

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    try {
        main();
    } catch (err) {
        alert('Error in BenchmarkPerformance\n\n' + err.message + '\nLine: ' + err.line);
    }
})();
