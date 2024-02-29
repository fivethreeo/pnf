function round(num, decimalPlaces) {
  var p = Math.pow(10, decimalPlaces || 0);
  var n = num * p * (1 + Number.EPSILON);
  return Math.round(n) / p;
}
function range(start, stop, step) {
  var a = [start],
    b = start;
  while (b < stop) {
    a.push((b += step || 1));
  }
  return a;
}

function log(v) {
  console.log(JSON.stringify(v, 2));
}
const eye = (n) => [...Array(n)].map((e, i, a) => a.map((e) => +!i--));

// Function to transpose a 2D array
function transpose(arr) {
  return arr[0].map((_, colIndex) => arr.map((row) => row[colIndex]));
}

// Function to multiply two matrices element-wise
function elementWiseMultiply(a, b) {
  return a.map((row, i) => row.map((val, j) => val * b[i][j]));
}

// Function to create a zero matrix of given dimensions
function createZeroMatrix(rows, cols) {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

class PointFigureChart {
  constructor(
    ts,
    method = "cl",
    reversal = 3,
    boxSize = 1,
    scaling = "log",
    title = null
  ) {
    // Chart parameters
    this.method = this._is_valid_method(method); // Assume existence of validation method
    this.reversal = this._is_valid_reversal(reversal); // Assume existence of validation method
    this.scaling = this._is_valid_scaling(scaling); // Assume existence of validation method
    this.boxSize = this._is_valid_boxsize(boxSize); // Assume existence of validation method

    // Prepare time series
    this.timeStep = null; // to be calculated in _prepare_ts
    this.ts = this._prepare_ts(ts); // Assume existence of preparation method
    // Chart
    // this.title = this._make_title(title); // Assume existence of title making method

    this.boxScale = this._get_boxscale(); // Assume existence of box scale calculation method

    this.pnfTimeSeries = this._get_pnf_timeseries(); // Assume existence of P&F time series calculation method

    this.matrix = this._pnf_timeseries2matrix(); // Assume existence of matrix construction method
    /* 
    
    this.columnLabels = this._get_column_entry_dates(); // Assume existence of column label extraction method
    
    // Trendlines
    this.trendlines = null;
    this.showTrendlines = false; // 'external', 'internal', 'both', false
    
    // Signals
    this.breakouts = null;
    this.buys = {};
    this.sells = {};
    this.showBreakouts = false;
    this.bullishBreakoutColor = 'green';
    this.bearishBreakoutColor = 'magenta';
    
    // Indicator
    this.columnMidpoints = null;
    this.indicator = {};
    this.vap = {};
    this.indicatorColors = null; // Placeholder for plt.cm.Set2 equivalent in JS
    this.indicatorFillcolorOpacity = 0.2;
    
    // Plotting coordinates/adjusted indicator
    this.plotBoxScale = null;
    this.plotMatrix = null;
    this.plotColumnIndex = null;
    this.plotColumnLabel = null;
    this.plotYTicks = null;
    this.plotYTickLabels = null;
    this.matrixTopCutIndex = null;
    this.matrixBottomCutIndex = null;
    this.plotIndicator = {};
    this.cut2Indicator = false;
    this.cut2IndicatorLength = null;
    
    // Plotting options
    this.size = 'auto';
    this.maxFigureWidth = 10;
    this.maxFigureHeight = 8;
    this.leftAxis = false;
    this.rightAxis = true;
    this.columnAxis = true;
    
    this.addEmptyColumns = 0;
    
    this.showMarkers = true;
    this.grid = null;
    this.xMarkerColor = 'grey';
    this.oMarkerColor = 'grey';
    this.gridColor = 'grey';
    
    this.figureWidth = null;
    this.figureHeight = null;
    this.matrixMinWidth = null;
    
    this.marginLeft = null;
    this.marginRight = null;
    this.marginTop = 0.3;
    this.marginBottom = null;
    this.boxHeight = null;
    
    this.markerLinewidth = null;
    this.gridLinewidth = null;
    
    this.xLabelStep = null;
    this.yLabelStep = null;
    
    this.labelFontsize = 8;
    this.titleFontsize = 8;
    this.legendFontsize = 8;
    
    this.legend = true;
    this.legendPosition = null;
    this.legendEntries = null;
    
    this.plotsizeOptions = {
        size: ['huge', 'large', 'medium', 'small', 'tiny'],
        grid: [true, true, true, false, false],
        matrixMinWidth: [12, 12, 27, 57, 117],
        boxHeight: [0.2, 0.15, 0.1, 0.05, 0.025],
        markerLinewidth: [1, 1, 1, 0.5, 0.5],
        gridLinewidth: [0.5, 0.5, 0.5, 0.25, 0.125],
        xLabelStep: [1, 1, 2, 4, 8],
        yLabelStep: [1, 1, 2, 4, 8],
    };
    
    // Figure and axis objects
    // Note: Actual JS plotting libraries would be used here
    this.fig = null;
    this.ax1 = null;
    this.ax2 = null;
    this.ax3 = null; */
  }

  _is_valid_method(method) {
    if (!["cl", "h/l", "l/h", "hlc", "ohlc"].includes(method)) {
      throw new Error(
        "Not a valid method. Valid methods are: cl, h/l, l/h, hlc, ohlc"
      );
    }
    return method;
  }

  _is_valid_reversal(reversal) {
    if (typeof reversal !== "number" || !Number.isInteger(reversal)) {
      throw new Error(
        "Value for reversal must be an integer. Reversal is usually between 1 and 5."
      );
    }
    return reversal;
  }

  _is_valid_scaling(scaling) {
    if (!["abs", "atr", "log", "cla"].includes(scaling)) {
      throw new Error("Not a valid scaling. Valid scales are: abs, atr, log, cla");
    }
    return scaling;
  }

  _is_valid_boxsize(boxsize) {
    if (this.scaling === "cla") {
      const valid_boxsize = [0.02, 0.05, 0.1, 0.25, 1 / 3, 0.5, 1, 2];
      if (!valid_boxsize.includes(boxsize)) {
        throw new Error(
          "For cla scaling valid values for boxsize are 0.02, 0.05, 0.1, 0.25, 1/3, 0.5, 1, 2"
        );
      }
    } else if (this.scaling === "log") {
      if (boxsize < 0.01) {
        throw new Error(
          "The smallest possible boxsize for log-scaled axis is 0.01%"
        );
      }
    } else if (this.scaling === "abs") {
      if (boxsize <= 0) {
        throw new Error("The boxsize must be a value greater than 0.");
      }
    } else if (this.scaling === "atr") {
      if (!Number.isInteger(boxsize) && boxsize !== 'total') {
        throw new Error("The atr boxsize must be a integer of periods or 'total'.");
      }
      if (boxsize !== 'total' && boxsize <= 0) {
        throw new Error("The boxsize must be a value greater than 0.");
      }
    }
    return boxsize;
  }

  _prepare_ts(ts) {
    // Bring all keys to lowercase characters
    ts = Object.entries(ts).reduce((acc, [key, val]) => {
      acc[key.toLowerCase()] = val;
      return acc;
    }, {});

    // Check if all required keys are available
    if (self.method === "cl") {
      if (!("close" in ts)) {
        throw new Error("The required key 'close' was not found in ts");
      }
    } else if (self.method === "h/l" || self.method === "l/h") {
      if (!("low" in ts)) {
        throw new Error("The required key 'low' was not found in ts");
      }
      if (!("high" in ts)) {
        throw new Error("The required key 'high' was not found in ts");
      }
    } else if (self.method === "hlc") {
      if (!("close" in ts)) {
        throw new Error("The required key 'close' was not found in ts");
      }
      if (!("low" in ts)) {
        throw new Error("The required key 'low' was not found in ts");
      }
      if (!("high" in ts)) {
        throw new Error("The required key 'high' was not found in ts");
      }
    } else if (self.method === "ohlc") {
      if (!("close" in ts)) {
        throw new Error("The required key 'close' was not found in ts");
      }
      if (!("low" in ts)) {
        throw new Error("The required key 'low' was not found in ts");
      }
      if (!("high" in ts)) {
        throw new Error("The required key 'high' was not found in ts");
      }
      if (!("open" in ts)) {
        throw new Error("The required key 'open' was not found in ts");
      }
    }
    if (self.scaling === "atr") {
      if (!("close" in ts)) {
        throw new Error("The required key 'close' was not found in ts");
      }
      if (!("low" in ts)) {
        throw new Error("The required key 'low' was not found in ts");
      }
      if (!("high" in ts)) {
        throw new Error("The required key 'high' was not found in ts");
      }
      if (this.boxSize !== 'total' && boxSize > ts.close.length-1) {
        throw new Error("ATR period is longer than length of periods");
      }
    }
    
    // Handle 'date' key, convert string to Date, and ensure chronological order
    if (
      !(
        "date" in ts ||
        ts["date"][0] === "string" ||
        ts["date"][0] instanceof Date
      )
    ) {
      ts["date"] = Array.from({ length: ts["close"].length }, (_, i) => i); // Create index if no date
    } else if (typeof ts["date"][0] === "string") {
      ts["date"] = ts["date"].map((date) => new Date(date));
      if (ts["date"][0] > ts["date"][ts["date"].length - 1]) {
        for (let key in ts) {
          ts[key] = ts[key].reverse(); // Flip arrays to ensure chronological order
        }
      }
    }

    // Check if all arrays have the same length
    let lengths = Object.values(ts).map((arr) => arr.length);
    if (new Set(lengths).size !== 1) {
      throw new Error(
        "All arrays in the time-series must have the same length"
      );
    }

    // Optionally, detect and set the time step based on the date differences if needed
    // This part is omitted but could involve comparing the difference between dates to set a time_step variable

    return ts;
  }
  _get_boxscale(overscan = null) {
    let [minimum, maximum] = [0, 0];

    if (this.method === "cl") {
      minimum = Math.min(...this.ts["close"]);
      maximum = Math.max(...this.ts["close"]);
    } else {
      minimum = Math.min(...this.ts["low"]);
      maximum = Math.max(...this.ts["high"]);
    }

    let boxes = new Array();

    let [overscan_top, overscan_bot] = [0, 0];

    if (overscan === null) {
      overscan = 20;
    }

    if (Number.isInteger(overscan)) {
      overscan_bot = overscan;
      overscan_top = overscan;
    } else if (Array.isArray(overscan)) {
      overscan_bot = overscan[0];
      overscan_top = overscan[1];
    }

    if (this.scaling === "abs" || this.scaling === "atr") {

      if (this.scaling === "atr") {
        let trueRanges = [];
        this.boxSize = this.boxSize === 'total' ? this.ts.high.length - 1: this.boxSize;
        // Calculate the true range for the last n days
        for (let i = this.ts.high.length - this.boxSize; i < this.ts.high.length; i++) {
          const highLow = this.ts.high[i] - this.ts.low[i];
          const highClosePrev = Math.abs(this.ts.high[i] - this.ts.close[i - 1]);
          const lowClosePrev = Math.abs(this.ts.low[i] - this.ts.close[i - 1]);

          // Calculate the true range for each day and add it to the array
          trueRanges.push(Math.max(highLow, highClosePrev, lowClosePrev));
        }

        // Calculate the average of the true ranges
        this.boxSize = trueRanges.reduce((acc, val) => acc + val, 0) / trueRanges.length;
        this.scaling = 'abs';
      }

      let decimals = this.boxSize.toString().split(".").pop().length;
      boxes.push(0.0);
      let boxSize = round(this.boxSize, decimals);

      while (boxes[0] <= minimum - (overscan_bot + 1) * boxSize) {
        boxes[0] = round(boxes[0] + boxSize, decimals);
      }
      let n = 0;
      while (boxes[n] <= maximum + (overscan_top - 1) * boxSize) {
        boxes.push(round(boxes[n] + boxSize, decimals));
        n++;
      }
    } else if (this.scaling === "log") {
      let boxSize = parseFloat(this.boxSize);
      let minval = 0.0001;
      boxes.push(Math.log(minval));
      let logBoxSize = Math.log(1 + boxSize / 100);
      while (boxes[0] <= Math.log(minimum) - (overscan_bot + 1) * logBoxSize) {
        boxes[0] = boxes[0] + logBoxSize;
      }
      let n = 0;
      while (boxes[n] <= Math.log(maximum) + (overscan_top - 1) * logBoxSize) {
        boxes.push(boxes[n] + logBoxSize);
        n++;
      }

      boxes = boxes.map(Math.exp);

      boxes = boxes.map((box) =>
        box >= 0.1 && box < 1
          ? round(box, 5)
          : box >= 1 && box < 10
          ? round(box, 4)
          : box >= 10 && box < 100
          ? round(box, 3)
          : box >= 100
          ? round(box, 2)
          : box
      );
    } else if (this.scaling === "cla") {
      let s = [0.2, 0.5, 1.0].map((v) => v * this.boxSize);
      let b1 = range(6, 14 - s[0], s[0]);
      let b2 = range(14, 29 - s[1], s[1]);
      let b3 = range(29, 60 - s[2], s[2]);

      let b0 = b1
        .concat(b2)
        .concat(b3)
        .map((b) => b / 1000);
      let g = 1;
      boxes.push(0);
      boxes = boxes.concat(b0.map((b) => b * g));

      while (boxes.slice(-overscan_top - 1)[0] < maximum) {
        g = g * 10;
        boxes = boxes.concat(b0.map((b) => round(b * g, 5)));
      }

      let start =
        boxes.flatMap((box, i) => (box <= minimum ? i : [])).pop() -
        overscan_bot;
      if (start < 0) {
        start = 0;
      }
      let end =
        boxes.flatMap((box, i) => (box > maximum ? i : []))[0] + overscan_top;

      boxes = boxes.slice(start, end);
    }

    return boxes;
  }

  _get_first_trend() {
    let [H, L] = [[], []];
    if (this.method === "cl" || this.method === "ohlc") {
      H = this.ts["close"];
      L = this.ts["close"];
    } else {
      H = this.ts["high"];
      L = this.ts["low"];
    }

    let Boxes = this.boxScale;

    let indexBoxUp = Boxes.flatMap((box, i) => (box >= H[0] ? i : []))[0];

    if (H[0] !== Boxes[indexBoxUp]) {
      indexBoxUp--;
    }

    let indexBoxDown = Boxes.flatMap((box, i) => (box <= L[0] ? i : [])).pop();

    let k = 1,
      [upTrendFlag, downTrendFlag] = [0, 0];

    while (upTrendFlag === 0 && downTrendFlag === 0 && k < H.length) {
      if (H[k] >= Boxes[indexBoxUp + 1]) {
        upTrendFlag = 1;
      } else if (L[k] <= Boxes[indexBoxDown - 1]) {
        downTrendFlag = -1;
      }
      k++;
    }
    let trendFlag = 0,
      indexBox = 0;
    if (upTrendFlag > 0) {
      trendFlag = upTrendFlag;
      indexBox = indexBoxUp;
    } else if (downTrendFlag < 0) {
      trendFlag = downTrendFlag;
      indexBox = indexBoxDown;
    }

    let indexColumn = 0;
    let filledBoxes = 1;
    let box = Boxes[indexBox];
    let indexDateEntry = k - 1;

    if (trendFlag === 0) {
      throw new Error(
        "Choose a smaller box size. There is no trend using the current parameter."
      );
    }

    return [indexDateEntry, box, indexBox, indexColumn, trendFlag, filledBoxes];
  }

  _basic(P, indexBox, indexColumn, trendFlag, filledBoxes) {
    let Boxes = this.boxScale,
      reversal = this.reversal,
      indexBoxPrevious = indexBox,
      filledBoxesPrevious = filledBoxes;

    if (trendFlag === 1) {
      if (P >= Boxes[indexBox + 1]) {
        while (P >= Boxes[indexBox + 1]) {
          indexBox++;
        }
        filledBoxes = filledBoxes + indexBox - indexBoxPrevious;
      }
      if (indexBox - reversal < 1) {
        indexBox = 1 + reversal;
      }
      if (P <= Boxes[indexBox - reversal]) {
        indexBox = Boxes.flatMap((box, i) => (box >= P ? i : []))[0];
        trendFlag = -1;
        indexColumn = indexColumn + 1;
        filledBoxes = indexBoxPrevious - indexBox;
        if (reversal === 1 && filledBoxesPrevious === 1) {
          indexColumn = indexColumn - 1;
          filledBoxes = filledBoxes + 1;
        }
      }
    } else if (trendFlag === -1) {
      if (indexBox - 1 < 1) {
        indexBox = 1 + 1;
      }
      if (P <= Boxes[indexBox - 1]) {
        while (P <= Boxes[indexBox - 1]) {
          indexBox = indexBox - 1;
        }
        filledBoxes = filledBoxes + indexBoxPrevious - indexBox;
      }
      if (P >= Boxes[indexBox + reversal]) {
        indexBox = Boxes.flatMap((box, i) => (box <= P ? i : [])).pop();
        trendFlag = 1;
        indexColumn = indexColumn + 1;
        filledBoxes = indexBox - indexBoxPrevious;
        if (reversal === 1 && filledBoxesPrevious === 1) {
          indexColumn = indexColumn - 1;
          filledBoxes = filledBoxes + 1;
        }
      }
    }

    let Box = Boxes[indexBox];

    return [Box, indexBox, indexColumn, trendFlag, filledBoxes];
  }

  _close(indexDateEntry, Box, indexBox, indexColumn, trendFlag, filledBoxes) {
    let C = this.ts["close"],
      ts = [];

    range(0, indexDateEntry).map(
      (i) => (ts[i] = [Box, indexBox, indexColumn, trendFlag, filledBoxes])
    );
    C = C.slice(indexDateEntry);

    for (const [n, P] of C.entries()) {
      [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
        P,
        indexBox,
        indexColumn,
        trendFlag,
        filledBoxes
      );

      ts[indexDateEntry + n] = [
        Box,
        indexBox,
        indexColumn,
        trendFlag,
        filledBoxes,
      ];
    }
    return ts;
  }

  _hilo(indexDateEntry, Box, indexBox, indexColumn, trendFlag, filledBoxes) {
    let [H, L] = [this.ts["high"], this.ts["low"]],
      Boxes = this.boxScale,
      reversal = this.reversal,
      ts = [],
      rest;

    range(0, indexDateEntry).map(
      (i) => (ts[i] = [Box, indexBox, indexColumn, trendFlag, filledBoxes])
    );

    range(indexDateEntry, H.length).forEach((n) => {
      let indexBoxPrevious = indexBox,
        filledBoxesPrevious = filledBoxes;

      if (trendFlag === 1) {
        if (H[n] >= Boxes[indexBox + 1]) {
          [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
            H[n],
            indexBox,
            indexColumn,
            trendFlag,
            filledBoxes
          );
        } else {
          if (indexBox - reversal < 1) {
            indexBox = 1 + reversal;
          }

          if (L[n] <= Boxes[indexBox - reversal]) {
            trendFlag = -1;
            [Box, indexBox, indexColumn, trendFlag, rest] = this._basic(
              L[n],
              indexBox,
              indexColumn,
              trendFlag,
              filledBoxes
            );
            indexColumn = indexColumn + 1;
            filledBoxes = indexBoxPrevious - indexBox;
            if (reversal === 1 && filledBoxesPrevious === 1) {
              indexColumn = indexColumn - 1;
              filledBoxes = filledBoxes + 1;
            }
          }
        }
      } else if (trendFlag === -1) {
        if (indexBox - 1 < 1) {
          indexBox = 1 + 1;
        }
        if (L[n] <= Boxes[indexBox - 1]) {
          [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
            L[n],
            indexBox,
            indexColumn,
            trendFlag,
            filledBoxes
          );
        } else {
          if (H[n] >= Boxes[indexBox + reversal]) {
            trendFlag = 1;
            [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
              H[n],
              indexBox,
              indexColumn,
              trendFlag,
              filledBoxes
            );

            indexColumn = indexColumn - 1;
            filledBoxes = filledBoxes + 1;

            if (reversal === 1 && filledBoxesPrevious === 1) {
              indexColumn = indexColumn - 1;
              filledBoxes = filledBoxes + 1;
            }
          }
        }
      }

      ts[n] = [Box, indexBox, indexColumn, trendFlag, filledBoxes];
    });
    return ts;
  }

  _lohi(indexDateEntry, Box, indexBox, indexColumn, trendFlag, filledBoxes) {
    let [H, L] = [this.ts["high"], this.ts["low"]],
      Boxes = this.boxScale,
      reversal = this.reversal,
      ts = [],
      rest;

    range(0, indexDateEntry).map(
      (i) => (ts[i] = [Box, indexBox, indexColumn, trendFlag, filledBoxes])
    );

    range(indexDateEntry, H.length).forEach((n) => {
      let indexBoxPrevious = indexBox,
        filledBoxesPrevious = filledBoxes;

      if (trendFlag === 1) {
        if (indexBox - reversal < 1) {
          indexBox = 1 + reversal;
        }
        if (L[n] <= Boxes[indexBox - reversal]) {
          trendFlag = -1;

          [Box, indexBox, indexColumn, trendFlag, rest] = this._basic(
            L[n],
            indexBox,
            indexColumn,
            trendFlag,
            filledBoxes
          );

          indexColumn = indexColumn + 1;
          filledBoxes = indexBoxPrevious - indexBox;

          if (reversal === 1 && filledBoxesPrevious === 1) {
            indexColumn = indexColumn - 1;
            filledBoxes = filledBoxes + 1;
          }
        } else {
          if (H[n] >= Boxes[indexBox + 1]) {
            [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
              H[n],
              indexBox,
              indexColumn,
              trendFlag,
              filledBoxes
            );
          }
        }
      } else if (trendFlag === -1) {
        if (H[n] >= Boxes[indexBox + reversal]) {
          trendFlag = 1;

          [Box, indexBox, indexColumn, trendFlag, rest] = this._basic(
            H[n],
            indexBox,
            indexColumn,
            trendFlag,
            filledBoxes
          );

          indexColumn = indexColumn + 1;
          filledBoxes = indexBox - indexBoxPrevious;

          if (reversal === 1 && filledBoxesPrevious === 1) {
            indexColumn = indexColumn - 1;
            filledBoxes = filledBoxes + 1;
          }
        } else {
          if (L[n] >= Boxes[indexBox - 1]) {
            [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
              L[n],
              indexBox,
              indexColumn,
              trendFlag,
              filledBoxes
            );
          }
        }
      }

      ts[n] = [Box, indexBox, indexColumn, trendFlag, filledBoxes];
    });
    return ts;
  }

  _hlc(indexDateEntry, Box, indexBox, indexColumn, trendFlag, filledBoxes) {
    let [H, L, C] = [this.ts["high"], this.ts["low"], this.ts["close"]],
      Boxes = this.boxScale,
      reversal = this.reversal,
      ts = [],
      rest;

    range(0, indexDateEntry).map(
      (i) => (ts[i] = [Box, indexBox, indexColumn, trendFlag, filledBoxes])
    );

    range(indexDateEntry, H.length).forEach((n) => {
      let indexBoxPrevious = indexBox,
        filledBoxesPrevious = filledBoxes;

      if (trendFlag === 1) {
        if (C[n] >= Boxes[indexBox + 1]) {
          [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
            H[n],
            indexBox,
            indexColumn,
            trendFlag,
            filledBoxes
          );
        } else {
          if (indexBox - reversal < 1) {
            indexBox = 1 + reversal;
          }
          if (C[n] <= Boxes[indexBox - reversal]) {
            trendFlag = -1;

            [Box, indexBox, indexColumn, trendFlag, rest] = this._basic(
              L[n],
              indexBox,
              indexColumn,
              trendFlag,
              filledBoxes
            );

            indexColumn = indexColumn + 1;
            filledBoxes = indexBoxPrevious - indexBox;

            if (reversal === 1 && filledBoxesPrevious === 1) {
              indexColumn = indexColumn - 1;
              filledBoxes = filledBoxes + 1;
            }
          }
        }
      } else if (trendFlag === -1) {
        if (C[n] <= Boxes[indexBox - 1]) {
          [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
            L[n],
            indexBox,
            indexColumn,
            trendFlag,
            filledBoxes
          );
        } else {
          if (C[n] >= Boxes[indexBox + reversal]) {
            trendFlag = 1;
            [Box, indexBox, indexColumn, trendFlag, rest] = this._basic(
              H[n],
              indexBox,
              indexColumn,
              trendFlag,
              filledBoxes
            );
            indexColumn = indexColumn + 1;
            filledBoxes = indexBox - indexBoxPrevious;
            if (reversal === 1 && filledBoxesPrevious === 1) {
              indexColumn = indexColumn - 1;
              filledBoxes = filledBoxes + 1;
            }
          }
        }
      }

      ts[n] = [Box, indexBox, indexColumn, trendFlag, filledBoxes];
    });
    return ts;
  }

  _ohlc() {
    let [O, H, L, C] = [
        this.ts["open"],
        this.ts["high"],
        this.ts["low"],
        this.ts["close"],
      ],
      P = [],
      tempP = [],
      counter = 0;

    range(counter, C.length).forEach((n) => {
      if (C[n] > O[n]) {
        tempP = [O[n], L[n], H[n], C[n]];
      } else if (C[n] < O[n]) {
        tempP = [O[n], H[n], L[n], C[n]];
      } else if (C[n] == O[n] && C[n] == L[n]) {
        tempP = [O[n], H[n], L[n], C[n]];
      } else if (C[n] == O[n] && C[n] == H[n]) {
        tempP = [O[n], L[n], H[n], C[n]];
      } else if (C[n] == O[n] && (H[n] + L[n]) / 2 > C[n]) {
        tempP = [O[n], H[n], L[n], C[n]];
      } else if (C[n] == O[n] && (H[n] + L[n]) / 2 < C[n]) {
        tempP = [O[n], L[n], H[n], C[n]];
      } else if (C[n] == O[n] && (H[n] + L[n]) / 2 == C[n]) {
        if (n > 1) {
          if (C[n - 1] < C[n]) {
            tempP = [O[n], H[n], L[n], C[n]];
          } else if (C[n - 1] > C[n]) {
            tempP = [O[n], L[n], H[n], C[n]];
          }
        } else {
          tempP = [O[n], H[n], L[n], C[n]];
        }
      }
      P = P.concat(tempP);
    });

    let close = [...this.ts["close"]];

    this.ts["close"] = P;
    let [indexDateEntry, Box, indexBox, indexColumn, trendFlag, filledBoxes] =
      this._get_first_trend();
    this.ts["close"] = close;

    let ts = [];
    range(0, indexDateEntry).map(
      (i) => (ts[i] = [Box, indexBox, indexColumn, trendFlag, filledBoxes])
    );

    range(indexDateEntry, P.length).forEach((n) => {
      [Box, indexBox, indexColumn, trendFlag, filledBoxes] = this._basic(
        P[n],
        indexBox,
        indexColumn,
        trendFlag,
        filledBoxes
      );
      ts[n] = [Box, indexBox, indexColumn, trendFlag, filledBoxes];
    });

    return ts;
  }

  _get_pnf_timeseries() {
    let ts = this.ts,
      date = this.ts["date"],
      pointFigureDate = [...date],
      [indexDateEntry, Box, indexBox, indexColumn, trendFlag, filledBoxes] =
        this._get_first_trend();

    if (this.method === "cl") {
      ts = this._close(
        indexDateEntry,
        Box,
        indexBox,
        indexColumn,
        trendFlag,
        filledBoxes
      );
    } else if (this.method === "h/l") {
      ts = this._hilo(
        indexDateEntry,
        Box,
        indexBox,
        indexColumn,
        trendFlag,
        filledBoxes
      );
    } else if (this.method === "l/h") {
      ts = this._lohi(
        indexDateEntry,
        Box,
        indexBox,
        indexColumn,
        trendFlag,
        filledBoxes
      );
    } else if (this.method === "hlc") {
      ts = this._hlc(
        indexDateEntry,
        Box,
        indexBox,
        indexColumn,
        trendFlag,
        filledBoxes
      );
    } else if (this.method === "ohlc") {
      ts = this._ohlc();
      if (this.ts["date"][0] instanceof Date) {
        let timestep = Math.min(
          ...date.slice(1).map((d, i) => d.valueOf() - date[i].valueOf())
        );
        pointFigureDate = [];
        range(0, date.length - 1).map((i) => {
          let datems = date[i].valueOf();
          // console.log(datems + round(timestep * 0.25,1));
          pointFigureDate.push(date[i]);
          pointFigureDate.push(new Date(datems + timestep * 0.25));
          pointFigureDate.push(new Date(datems + timestep * 0.5));
          pointFigureDate.push(new Date(datems + timestep * 0.75));
        });
      } else {
        pointFigureDate = range(0, ts.length);
      }
    }

    let indexTrendChange = ts.slice(1).map((t, i) => ts[i][3] !== t[3]);
    let indexBoxChange = ts.slice(1).map((t, i) => ts[i][1] !== t[1]);

    let pftseries = {
      date: pointFigureDate,
      "box value": [],
      "box index": [],
      "column index": [],
      trend: [],
      "filled boxes": [],
    };
    indexTrendChange.map((trendChange, i) => {
      let anyChange = trendChange || indexBoxChange[i];
      if (anyChange) {
        pftseries["box value"].push(ts[i][0]);
        pftseries["box index"].push(ts[i][1]);
        pftseries["column index"].push(ts[i][2]);
        pftseries["trend"].push(ts[i][3]);
        pftseries["filled boxes"].push(ts[i][4]);
      } else {
        pftseries["box value"].push(NaN);
        pftseries["box index"].push(NaN);
        pftseries["column index"].push(NaN);
        pftseries["trend"].push(NaN);
        pftseries["filled boxes"].push(NaN);
      }
    });
    return pftseries;
  }

  _pnf_timeseries2matrix() {
    let ts = this.pnfTimeSeries,
      Boxes = this.boxScale;

    let boxIndex = ts["box index"],
      columnIndex = ts["column index"],
      trendIndex = ts["trend"];

    let nanIndex = boxIndex.flatMap((b, i) => (!isNaN(b) ? i : []));

    boxIndex = nanIndex.map((index) => boxIndex[index]);
    columnIndex = nanIndex.map((index) => columnIndex[index]);
    trendIndex = nanIndex.map((index) => trendIndex[index]);

    let columns = columnIndex.pop() + 1;
    let mtx = [...Array(Boxes.length)].map((e) => Array(columns).fill(0));

    // Mark the first box
    if (trendIndex[0] === 1) {
      mtx[boxIndex[0]][0] = 1;
    } else if (trendIndex[0] === -1) {
      mtx[boxIndex[0]][0] = -1;
    }
    // Mark the other boxes
    for (let n = 1; n < boxIndex.length; n++) {
      // Positive trend goes on
      if (trendIndex[n - 1] === 1 && trendIndex[n] === 1) {
        for (let i = boxIndex[n - 1]; i <= boxIndex[n]; i++) {
          mtx[i][columnIndex[n]] = trendIndex[n];
        }
      }
      // Positive trend reverses
      else if (trendIndex[n - 1] === 1 && trendIndex[n] === -1) {
        for (let i = boxIndex[n]; i < boxIndex[n - 1]; i++) {
          // This might need adjustment based on the desired behavior
          mtx[i][columnIndex[n]] = trendIndex[n];
        }
      }
      // Negative trend goes on
      else if (trendIndex[n - 1] === -1 && trendIndex[n] === -1) {
        for (let i = boxIndex[n]; i <= boxIndex[n - 1]; i++) {
          // This might need adjustment based on the desired behavior
          mtx[i][columnIndex[n]] = trendIndex[n];
        }
      }
      // Negative trend reverses
      else if (trendIndex[n - 1] === -1 && trendIndex[n] === 1) {
        for (let i = boxIndex[n - 1] + 1; i <= boxIndex[n]; i++) {
          mtx[i][columnIndex[n]] = trendIndex[n];
        }
      }
    }

    return mtx;
  }

  getTrendLines(length = 4, mode = "strong") {
    let mtx = this.matrix.map((row) => [...row]);
    if (mode == "weak" && length <= 3) {
      length = 4;
      console.warn(
        "Set trendline length to 4. Minimum Length for trendlines of mode=weak is 4."
      );
    } else if (mode == "strong" && length <= 2) {
      length = 3;
      console.warn(
        "Set trendline length to 3. Minimum Length for trendlines of mode=strong is 3."
      );
    }
    if (
      mtx.map((row) => row[0]).reduce((acc, val) => acc + Math.abs(val), 0) == 1
    ) {
      if (mtx.map((row) => row[0]).reduce((acc, val) => acc + val, 0) > 0) {
        let idx = mtx.flatMap((row, i) => (row[0] !== 0 ? i : [])).pop();
        mtx[idx - 1][0] = 1;
      } else if (
        mtx.map((row) => row[0]).reduce((acc, val) => acc + val, 0) > 0
      ) {
        let idx = mtx.flatMap((row, i) => (row[0] !== 0 ? i : [])).pop();
        mtx[idx + 1][0] = 1;
      }
    }

    let T = Array.from({ length: mtx[0].length }).map(() =>
      Array.from({ length: mtx.length }).map((v, i) => i + 1)
    );
    // Transpose the sequence array

    T = transpose(T);

    // Multiply the transposed array element-wise by mtx
    T = elementWiseMultiply(T, mtx);

    T = T.map((row) => row.map(Math.abs));
    // Initialize ceiling and floor arrays with zeroes
    const cols = T[0].length;
    let ceil = new Array(cols).fill(0);
    let floor = new Array(cols).fill(0);

    for (let n = 0; n < cols - 1; n++) {
      let column = T.map((row) => row[n]);
      let nonZeroColumn = column.filter((value) => value !== 0);

      // Finding the highest and lowest values in the column
      let high = Math.max(...column);
      let low = Math.min(...nonZeroColumn);

      // Finding indices for ceiling and floor
      ceil[n] = column.indexOf(high);
      floor[n] = column.indexOf(low);

      // Adjusting based on conditions
      if (Math.sign(mtx[ceil[n]][n]) < 0) {
        ceil[n] *= -1;
      }
      if (Math.sign(mtx[floor[n]][n]) < 0) {
        floor[n] *= -1;
      }
    }

    // Calculate the offset, equivalent to np.size(mtx, 1)
    const offset = mtx[0].length;
    // Extending mtx in variable T
    // Step 1: Create top and bottom zero matrices and concatenate them with mtx
    const topZeroMatrix = createZeroMatrix(offset, offset);
    const bottomZeroMatrix = createZeroMatrix(offset, offset);
    T = [...topZeroMatrix, ...mtx, ...bottomZeroMatrix]; // Equivalent to vstack in NumPy

    // Step 2: Extend T to the right with zeros to prevent trendlines from running out
    T = T.map((row) => [...row, ...new Array(length - 1).fill(0)]); // Equivalent to hstack in NumPy

    // Add a column of ones to the right side of T to stop the latest trendlines
    T = T.map((row) => [...row, 1]);

    // Adjusting new indices after extension
    ceil = ceil.map((c) => (c > 0 ? c + offset : c - offset));
    floor = floor.map((f) => (f > 0 ? f + offset : f - offset));

    // Initiate trendLineMtx as a matrix containing all possible trendlines
    let trendLineMtx = createZeroMatrix(T.length, T[0].length);

    if (mode === "weak") {
      // Initialize matrix for breakpoints for trendlines
      let breakPoint = createZeroMatrix(T.length, T[0].length);

      // Assuming `getBreakouts` function and `breakouts` variable exist in your context
      // This part needs to be adapted based on your actual implementation
      let bo =
        this.breakouts !== undefined ? this.breakouts : this.getBreakouts();

      // Process breakouts for trend = 1
      bo.trend
        .flatMap((b, i) => (b === 1 ? i : []))
        .forEach((b) => {
          breakPoint[bo["box index"][b] + offset][bo["column index"][b]] = 1;
        });

      // Process breakouts for trend = -1
      bo.trend
        .flatMap((b, i) => (b === -1 ? i : []))
        .forEach((b) => {
          breakPoint[bo["box index"][b] + offset][bo["column index"][b]] = -1;
        });

      // Fill trendLineMtx with the length of the trendline at the position of the starting point
      floor.forEach((f, n) => {
        if (ceil[n] > 0) {
          let k = ceil[n] + 1;
          let col = n;

          while (
            breakPoint.slice(k, -1).reduce((acc, row) => acc + row[col], 0) <=
              0 &&
            col < breakPoint[0].length - 1
          ) {
            col += 1;
            k -= 1;
          }

          trendLineMtx[Math.abs(ceil[n]) + 1][n] = n - col;
        }
      });
      // Fill trendLineMtx with the length of the trendline at the position of the starting point
      ceil.forEach((f, n) => {
        if (floor[n] < 0) {
          let k = Math.abs(floor[n]) - 1;
          let col = n;

          while (
            breakPoint.slice(0, k).reduce((acc, row) => acc + row[col], 0) >=
              0 &&
            col < breakPoint[0].length - 1
          ) {
            col += 1;
            k += 1;
          }

          trendLineMtx[Math.abs(floor[n]) - 1][n] = col - n;
        }
      });

      // Set all trendlines to zero which are shorter than the minimum length
      trendLineMtx = trendLineMtx.map((row) =>
        row.map((value) => (Math.abs(value) < length ? 0 : value))
      );
    } else if (mode === "strong") {
      // Fill trendLineMtx with the length of the trendline at the position of the starting point
      floor.forEach((f, n) => {
        if (ceil[n] > 0) {
          let k = ceil[n] + 1;
          let col = n;

          while (T[k][col] === 0) {
            col += 1;
            k -= 1;
          }

          trendLineMtx[Math.abs(ceil[n]) + 1][n] = n - col;
        }
      });
      // Fill trendLineMtx with the length of the trendline at the position of the starting point
      ceil.forEach((f, n) => {
        if (floor[n] > 0) {
          let k = Math.abs(floor[n]) - 1;
          let col = n;

          while (T[k][col] === 0) {
            col += 1;
            k += 1;
          }

          trendLineMtx[Math.abs(floor[n]) - 1][n] = col - n;
        }
      });

      // Set all trendlines to zero which are shorter than the minimum length
      trendLineMtx = trendLineMtx.map((row) =>
        row.map((value) => (Math.abs(value) < length ? 0 : value))
      );
    }

    let loop_run = 0; // Counter for the loop to exit if an unexpected case occurred

    // Find first trendline
    let col = 0;
    while (
      trendLineMtx.reduce((acc, row) => acc + Math.abs(row[col]), 0) === 0
    ) {
      col += 1;
    }

    // Initiate variables for the lookup of external trendlines
    // Find the index of the last Box (iB), TrendFlag (tF), and the length of the trendline (span)
    let boxIndex, trendFlag, span;
    for (let row = 0; row < trendLineMtx.length; row++) {
      if (trendLineMtx[row][col] !== 0) {
        boxIndex = row;
        trendFlag = Math.sign(trendLineMtx[row][col]);
        span = Math.abs(trendLineMtx[row][col]);
        break; // Found the first non-zero trendline, no need to continue
      }
    }

    // trendLineVector: 1D vector of trendlines, initialized based on the size of trendLineMtx
    let trendLineVector = new Array(trendLineMtx[0].length).fill(0);
    trendLineVector[col] = span * trendFlag; // Assign the span multiplied by the TrendFlag to the corresponding column

    while (col + span <= T[0].length - length - 1 && loop_run <= T[0].length) {
      let v_down = trendLineMtx.map((row) =>
        row
          .slice(col, col + span)
          .map((v) => (v > 0 ? 0 : v))
          .reduce((acc, val) => acc + val, 0)
      );
      let v_up = trendLineMtx.map((row) =>
        row
          .slice(col, col + span)
          .map((v) => (v < 0 ? 0 : v))
          .reduce((acc, val) => acc + val, 0)
      );
      if (trendFlag === 1) {
        v_down.forEach((val, x) => {
          if (val !== 0) {
            let idx = v_down.flatMap((v, i) => (v == val ? i : []))[0];
            let a = v_down.length - idx;
            let b = idx;
            // create n x n inentity matrix, flip upside down
            let z = eye(a).reverse();
            boxIndex = trendLineMtx.flatMap((value, i) =>
              value[col + b] !== 0 ? i : []
            )[0];
            let check = T.slice(boxIndex - z.length + 1, boxIndex + 1).map(
              (row) => row.slice(col + b, col + b + z.length)
            );
            if (
              check
                .map((row, i) => row.some((value, j) => value * z[i][j] !== 0))
                .some((result) => result === true)
            ) {
              v_down[x] = 0;
            }
          }
        });
      } else if (trendFlag === -1) {
        v_up.forEach((val, x) => {
          if (val !== 0) {
            let idx = v_up.flatMap((v, i) => (v == val ? i : []))[0];
            let a = v_up.length - idx;
            let b = idx;
            // create n x n inentity matrix
            let z = eye(a);
            boxIndex = trendLineMtx.flatMap((value, i) =>
              value[col + b] !== 0 ? i : []
            )[0];
            let check = T.slice(boxIndex - 1, boxIndex + z.length - 1).map(
              (row) => row.slice(col + b, col + b + z.length)
            );
            if (
              check
                .map((row, i) => row.some((value, j) => value * z[i][j] !== 0))
                .some((result) => result === true)
            ) {
              v_up[x] = 0;
            }
          }
        });
      }
      if (trendFlag === 1) {
        let check = v_down.map((value, index) => {
          return value < 0 ? index + 1 + Math.abs(value) : 0;
        });
        let maxCheck = Math.max(...check);
        if (v_down.some((value) => value !== 0)) {
          if (check.some((value) => value > v_down.length)) {
            col = col + check.flatMap((c, i) => (c === maxCheck ? i : []))[0];
            span = trendLineMtx
              .map((r) => r[col])
              .reduce((acc, val) => acc + Math.abs(val), 0);
            trendFlag = Math.sign(
              trendLineMtx.map((r) => r[col]).reduce((acc, val) => acc + val, 0)
            );
            trendLineVector[col] = span * trendFlag;
          } else {
            trendLineMtx.forEach((v, i) => {
              range(col + 1, col + span - 1).forEach((c) => {
                trendLineMtx[i][c] = 0;
              });
            });
          }
        } else if (check.every((value) => value === 0)) {
          col = col + check.length;
          span = 1;
          while (
            trendLineMtx
              .map((row) =>
                row
                  .slice(col, col + span)
                  .reduce((acc, val) => acc + Math.abs(val), 0)
              )
              .reduce((acc, val) => acc + val, 0) === 0
          ) {
            span = span + 1;
          }
          col = col + span - 1;
          span = Math.abs(
            trendLineMtx
              .map((row) => row[col])
              .reduce((acc, val) => acc + Math.abs(val), 0)
          );
          trendFlag = Math.sign(
            trendLineMtx
              .map((row) => row[col])
              .reduce((acc, val) => acc + val, 0)
          );
          trendLineVector[col] = span * trendFlag;
        }
      } else if (trendFlag === -1) {
        let check = v_up.map((value, index) => {
          return value > 0 ? index + 1 + value : 0;
        });
        let maxCheck = Math.max(...check);
        if (v_up.some((value) => value !== 0)) {
          if (check.some((value) => value > v_up.length)) {
            col = col + check.flatMap((c, i) => (c === maxCheck ? i : []))[0];
            span = trendLineMtx
              .map((row) => row[col])
              .reduce((acc, val) => acc + val, 0);
            trendFlag = Math.sign(
              trendLineMtx
                .map((row) => row[col])
                .reduce((acc, val) => acc + val, 0)
            );
            trendLineVector[col] = span * trendFlag;
          } else {
            trendLineMtx.forEach((row, i) => {
              range(col + 1, col + span - 1).forEach((c) => {
                trendLineMtx[i][c] = 0;
              });
            });
          }
        } else if (check.every((value) => value === 0)) {
          col = col + check.length;
          span = 1;
          while (
            trendLineMtx.reduce(
              (acc, row) =>
                acc +
                row
                  .slice(col, col + span)
                  .reduce((sum, val) => sum + Math.abs(val), 0),
              0
            ) === 0
          ) {
            span = span + 1;
          }
          col = col + span - 1;
          span = Math.abs(
            trendLineMtx
              .map((row) => row[col])
              .reduce((acc, val) => acc + val, 0)
          );
          trendFlag = Math.sign(
            trendLineMtx
              .map((row) => row[col])
              .reduce((acc, val) => acc + val, 0)
          );
          trendLineVector[col] = span * trendFlag;
        }
      }
      loop_run++;
      if (loop_run >= T[0].length) {
        throw new Error(
          "An unexpected case occurred during evaluating the trendlines."
        );
      }
    }
    let final_rows = [];
    let final_cols = [];

    trendLineMtx.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (value !== 0) {
          final_rows.push(rowIndex);
          final_cols.push(colIndex);
        }
      });
    });

    const trendLines = {
      bounded: new Array(final_cols.length).fill(""),
      type: new Array(final_cols.length).fill(""),
      length: new Array(final_cols.length).fill(0),
      "column index": new Array(final_cols.length).fill(0),
      "box index": new Array(final_cols.length).fill(0),
    };
    final_cols.forEach((value, index) => {
      if (trendLineVector[final_cols[index]] !== 0) {
        trendLines["bounded"][index] = "external";
      } else {
        trendLines["bounded"][index] = "internal";
      }
      trendLines["column index"][index] = final_cols[index];
      trendLines["box index"][index] = final_rows[index] - offset;
      if (
        Math.abs(trendLineMtx[final_rows[index]][final_cols[index]]) >=
        mtx[0].length
      ) {
        trendLines["length"][index] =
          Math.abs(trendLineMtx[final_rows[index]][final_cols[index]]) -
          length +
          1;
      } else {
        trendLines["length"][index] = Math.abs(
          trendLineMtx[final_rows[index]][[final_cols[index]]]
        );
      }
      if (trendLineMtx[final_rows[index]][final_cols[index]] > 0) {
        trendLines["type"][index] = "bullish support";
      } else {
        trendLines["type"][index] = "bearish resistance";
      }
    });

    let indicesToRemove = trendLines["length"].flatMap((len, idx) =>
      len === 0 ? idx : []
    );
    Object.keys(trendLines).forEach((key) => {
      trendLines[key] = trendLines[key].filter(
        (_, index) => !indicesToRemove.includes(index)
      );
    });
    const sortIndexes = trendLines["column index"]
      .map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value)
      .map((obj) => obj.index);

    // Step 2: Reorder all arrays in tlines based on the sorted indices
    Object.keys(trendLines).forEach((key) => {
      const sortedArray = new Array(trendLines[key].length);
      sortIndexes.forEach((sortedIndex, originalIndex) => {
        sortedArray[originalIndex] = trendLines[key][sortedIndex];
      });
      trendLines[key] = sortedArray;
    });
    this.trendLines = trendLines;
    return trendLines;
  }

  getBreakouts() {
    let mtx = this.matrix;

    // Initialize a matrix a with zeros
    const a = new Array(mtx.length).fill(0).map(() => [0]);

    // Compute b by subtracting each element of mtx by its previous, column-wise
    const b = mtx.map((row) => row.slice(1).map((val, i) => val - row[i]));

    // Find potential bullish breakouts
    let T = a.map((row, i) => [row[0], ...b[i]]);
    T.forEach((row, rowIndex) =>
      row.forEach((val, colIndex) => {
        if (val < 1 || mtx[rowIndex][colIndex] < 1) {
          T[rowIndex][colIndex] = 0;
        }
      })
    );

    // Row and col index of potential bullish breakouts
    const row_bull = [];
    const col_bull = [];
    T.forEach((row, rowIndex) =>
      row.forEach((val, colIndex) => {
        if (val === 1) {
          row_bull.push(rowIndex);
          col_bull.push(colIndex);
        }
      })
    );

    // Find potential bearish breakouts
    T = a.map((row, i) => [row[0], ...b[i]]);
    T.forEach((row, rowIndex) =>
      row.forEach((val, colIndex) => {
        if (val < -1 || mtx[rowIndex][colIndex] > -1) {
          T[rowIndex][colIndex] = 0;
        }
      })
    );

    // Row and col index of potential bearish breakouts
    const row_bear = [];
    const col_bear = [];
    T.forEach((row, rowIndex) =>
      row.forEach((val, colIndex) => {
        if (val === -1) {
          row_bear.push(rowIndex);
          col_bear.push(colIndex);
        }
      })
    );

    // Initiate object for breakouts
    const keys = [
      "trend",
      "type",
      "column index",
      "box index",
      "hits",
      "width",
      "outer width",
    ];
    const bo = {};
    keys.forEach((key) => {
      bo[key] = new Array(row_bull.length + row_bear.length).fill(0);
    });

    // Assign trends
    for (let i = 0; i < row_bull.length; i++) {
      bo["trend"][i] = 1; // Bullish trend
    }
    for (let i = row_bull.length, j = 0; j < row_bear.length; i++, j++) {
      bo["trend"][i] = -1; // Bearish trend
    }

    // Bullish breakouts
    if (row_bull.length > 0) {
      row_bull.forEach((rowIndex, n) => {
        bo["box index"][n] = rowIndex;
        bo["column index"][n] = col_bull[n];

        // Horizontal resistance line and breakout line
        const hRL = mtx[rowIndex - 1].slice(0, col_bull[n] + 1);
        const boL = mtx[rowIndex].slice(0, col_bull[n] + 1);

        // Finding i and k as per the conditions
        let i = hRL.lastIndexOf(-1);
        let kIndexes = hRL
          .map((val, index) => (val === 1 ? index : -1))
          .filter((index) => index !== -1);
        let kIndexes2 =
          kIndexes.length > 0 ? kIndexes.filter((val) => val > i) : [];
        kIndexes = kIndexes2.length > 0 ? kIndexes2 : kIndexes;
        let k = kIndexes.length > 0 ? Math.max(...kIndexes) : 0;

        // Determine the type of signal
        let z = 0;
        if (boL.slice(0, -1).some((val) => val !== 0) && kIndexes.length >= 2) {
          z = boL.slice(0, -1).findLastIndex((val) => val !== 0);
          bo["outer width"][n] = k - z + 1;
        } else if (kIndexes.length >= 2) {
          bo["outer width"][n] = k + 1;
        }

        if (z >= 1) {
          // Assigning types based on mtx values
          let prevVal = mtx[rowIndex][z - 1];
          let currentVal = mtx[rowIndex][z];

          if (
            (prevVal === 0 && currentVal === 1) ||
            (prevVal === 1 && currentVal === 1)
          )
            bo["type"][n] = "resistance";
          else if (prevVal === -1 && currentVal === -1)
            bo["type"][n] = "fulcrum";
          else if (
            (prevVal === -1 && currentVal === 1) ||
            (prevVal === 0 && currentVal === -1) ||
            (prevVal === 1 && currentVal === -1)
          )
            bo["type"][n] = "reversal";
          else if (prevVal === 0 && currentVal === 0) bo["type"][n] = "conti";
        } else if (z === 0) {
          // Conditions when z is 0
          let firstVal = mtx[rowIndex][z];
          if (firstVal === 0 || firstVal === 1) bo["type"][n] = "conti";
          else if (firstVal === -1) bo["type"][n] = "reversal";
        }

        if (kIndexes.length >= 2) {
          bo["hits"][n] = kIndexes.length;
          bo["width"][n] = k - kIndexes[0] + 1;
        }

        // Find smaller breakouts within other breakouts
        if (kIndexes.length > 2) {
          kIndexes.slice(1, -1).forEach((p) => {
            bo["trend"].push(1);
            bo["type"].push(bo["type"][n]);
            bo["column index"].push(bo["column index"][n]);
            bo["box index"].push(bo["box index"][n]);
            bo["hits"].push(
              hRL.slice(p, k + 1).filter((val) => val === 1).length
            );
            bo["width"].push(k - p + 1);
            bo["outer width"].push(bo["outer width"][n]);
          });
        }
      });
    }

    // Bearish breakouts
    if (row_bear.length > 0) {
      row_bear.forEach((rowIndex, n) => {
        const indexOffset = row_bull.length + n;
        bo["box index"][indexOffset] = rowIndex;
        bo["column index"][indexOffset] = col_bear[n];

        // Horizontal resistance line and breakout line
        const hRL = mtx[rowIndex + 1]
          ? mtx[rowIndex + 1].slice(0, col_bear[n] + 1)
          : [];
        const boL = mtx[rowIndex].slice(0, col_bear[n] + 1);

        // Finding i and k as per the conditions
        let i = hRL.lastIndexOf(1);

        let kIndexes = hRL
          .map((val, index) => (val === -1 ? index : -1))
          .filter((index) => index !== -1);

        let kIndexes2 =
          kIndexes.length > 0 ? kIndexes.filter((val) => val > i) : [];
        kIndexes = kIndexes2.length > 0 ? kIndexes2 : kIndexes;
        let k = kIndexes.length > 0 ? Math.max(...kIndexes) : 0;

        // Determine the type of signal
        let z = boL.slice(0, -1).findLastIndex((val) => val !== 0);
        if (z >= 0 && kIndexes.length >= 2) {
          bo["outer width"][indexOffset] = k - z + 1;
        } else if (kIndexes.length >= 2) {
          bo["outer width"][indexOffset] = k + 1;
        }
        if (z >= 1) {
          // Assigning types based on mtx values
          let prevVal = mtx[rowIndex][z - 1];
          let currentVal = mtx[rowIndex][z];

          if (
            (prevVal === 0 && currentVal === -1) ||
            (prevVal === -1 && currentVal === -1)
          )
            bo["type"][n] = "resistance";
          else if (prevVal === -1 && currentVal === -1)
            bo["type"][n] = "fulcrum";
          else if (
            (prevVal === 1 && currentVal === 1) ||
            (prevVal === 1 && currentVal === -1) ||
            (prevVal === 0 && currentVal === 1) ||
            (prevVal === -1 && currentVal === 1)
          )
            bo["type"][indexOffset] = "reversal";
          else if (prevVal === 0 && currentVal === 0)
            bo["type"][indexOffset] = "conti";
        } else if (z === 0) {
          // Conditions when z is 0
          let firstVal = mtx[rowIndex][z];
          if (firstVal === 0 || firstVal === -1)
            bo["type"][indexOffset] = "conti";
          else if (firstVal === 1) bo["type"][indexOffset] = "reversal";
        }

        if (kIndexes.length >= 2) {
          bo["hits"][indexOffset] = kIndexes.length;
          bo["width"][indexOffset] = k - kIndexes[0] + 1;
        }

        // Find smaller breakouts within other breakouts
        if (kIndexes.length > 2) {
          kIndexes.slice(1, -1).forEach((p) => {
            bo["trend"].push(-1);
            bo["type"].push(bo["type"][indexOffset]);
            bo["column index"].push(bo["column index"][indexOffset]);
            bo["box index"].push(bo["box index"][indexOffset]);
            const hitsCount = mtx[rowIndex + 1]
              .slice(p, k + 1)
              .filter((val) => val === -1).length;
            bo["hits"].push(hitsCount);
            bo["width"].push(k - p + 1);
            bo["outer width"].push(bo["outer width"][indexOffset]);
          });
        }
      });
    }

    // Sort order: col, row, hits
    // Combine the columns into a single array of objects for sorting
    let combined = bo["column index"].map((col, i) => {
      let dict = {};
      Object.keys(bo).forEach((key) => {
        dict[key] = bo[key][i];
      });
      return dict;
    });
    combined = combined.filter((v) => v.hits !== 0);
    // Sort by col, then row, then hits
    combined.sort((a, b) => {
      if (a["column index"] !== b["column index"])
        return a["column index"] - b["column index"];
      if (a["row index"] !== b["row index"])
        return a["row index"] - b["row index"];
      return a.hits - b.hits;
    });

    // Correctly update bo with sorted order
    Object.keys(bo).forEach((key) => {
      // Directly update 'column index', 'box index', and 'hits' from sorted combined array
      bo[key] = combined.map((item) => item[key]);
    });
    this.breakouts = bo; // Uncomment or adapt based on your environment

    return bo;
  }

  nextSimpleSignal() {
    let nextBuy = NaN;
    let nextSell = NaN;
    let idx = this.pnfTimeSeries["trend"]
      .flatMap((value, index) => (!isNaN(value) ? index : []))
      .pop();
    let lastTrend = this.pnfTimeSeries["trend"][idx];
    if (this.matrix[0].length >= 3) {
      let mtx = this.matrix.map((row) => row.slice(-3)); // Copy and take the last 3 columns

      const xCol1 = mtx.flatMap((row, index) => (row[0] === 1 ? index : []));
      const xCol2 = mtx.flatMap((row, index) => (row[1] === 1 ? index : []));
      const xCol3 = mtx.flatMap((row, index) => (row[2] === 1 ? index : []));

      const oCol1 = mtx.flatMap((row, index) => (row[0] === -1 ? index : []));
      const oCol2 = mtx.flatMap((row, index) => (row[1] === -1 ? index : []));
      const oCol3 = mtx.flatMap((row, index) => (row[2] === -1 ? index : []));

      if (lastTrend === 1) {
        idx =
          xCol2.length > 0 ? xCol2[xCol2.length - 1] : xCol1[xCol1.length - 1];
        nextBuy =
          idx + 1 > xCol3[xCol3.length - 1] ? this.boxScale[idx + 1] : NaN;

        idx = oCol3.length > 0 ? oCol3[0] : oCol2[0];
        nextSell = this.boxScale[idx] - 1;
      } else if (lastTrend === -1) {
        idx = oCol2.length > 0 ? oCol2[0] : oCol1[0];
        nextSell = idx - 1 < oCol3[0] ? this.boxScale[idx - 1] : NaN;

        idx =
          xCol3.length > 0 ? xCol3[xCol3.length - 1] : xCol2[xCol2.length - 1];
        nextBuy = this.boxScale[idx + 1];
      }
    }
    return { nextBuy, nextSell };
  }

  multipleTopBuy(label, multiple) {
    let maxWidth = 2 * multiple - 1;
    let array = Array.from({
      length: this.pnfTimeSeries["box index"].length,
    }).fill(NaN);
    let x = [];

    // Assuming all arrays in self.breakouts have the same length
    this.breakouts.trend.forEach((trend, index) => {
      if (
        trend === 1 &&
        this.breakouts.width[index] <= maxWidth &&
        this.breakouts.hits[index] === multiple
      ) {
        x.push(index);
      }
    });

    col = this.breakouts["column index"][x];
    row = this.breakouts["box index"][x];

    row.forEach((r, index) => {
      const c = col[index];
      // Find indices where column index matches 'c'
      const colIdx = this.pnfTimeSeries["column index"].reduce(
        (acc, value, idx) => {
          if (value === c) acc.push(idx);
          return acc;
        },
        []
      );

      // Find row indices corresponding to colIdx
      const rowIdx = colIdx.map((idx) => this.pnfTimeSeries["box index"][idx]);

      // Find the first ts_idx where row index is greater than or equal to 'r'
      const tsIdx = rowIdx.find((value) => value >= r);

      // Update 'array' where 'box index' equals 'tsIdx' and 'column index' equals 'c'
      this.pnfTimeSeries["box index"].forEach((value, idx) => {
        if (value === tsIdx && this.pnfTimeSeries["column index"][idx] === c) {
          array[idx] = this.boxScale[r]; // Assume this.boxscale[r] is the intended value
        }
      });
    });

    this.buys[label] = array; // Store the updated 'array' in 'buys' object under the 'label'
  }

  multipleBottomSell(label, multiple) {
    let maxWidth = 2 * multiple - 1;
    let array = Array.from({
      length: this.pnfTimeSeries["box index"].length,
    }).fill(NaN);
    let x = [];

    // Assuming all arrays in self.breakouts have the same length
    this.breakouts.trend.forEach((trend, index) => {
      if (
        trend === -1 &&
        this.breakouts.width[index] <= maxWidth &&
        this.breakouts.hits[index] === multiple
      ) {
        x.push(index);
      }
    });

    col = this.breakouts["column index"][x];
    row = this.breakouts["box index"][x];

    row.forEach((r, index) => {
      const c = col[index];
      // Find indices where column index matches 'c'
      const colIdx = this.pnfTimeSeries["column index"].reduce(
        (acc, value, idx) => {
          if (value === c) acc.push(idx);
          return acc;
        },
        []
      );

      // Find row indices corresponding to colIdx
      const rowIdx = colIdx.map((idx) => this.pnfTimeSeries["box index"][idx]);

      // Find the first ts_idx where row index is greater than or equal to 'r'
      const tsIdx = rowIdx.find((value) => value <= r);

      // Update 'array' where 'box index' equals 'tsIdx' and 'column index' equals 'c'
      this.pnfTimeSeries["box index"].forEach((value, idx) => {
        if (value === tsIdx && this.pnfTimeSeries["column index"][idx] === c) {
          array[idx] = this.boxScale[r]; // Assume this.boxscale[r] is the intended value
        }
      });
    });

    this.sells[label] = array; // Store the updated 'array' in 'sells' object under the 'label'
  }

  doubleTopBuy() {
    this.multipleTopBuy("DTB", 2);
  }

  doubleBottomSell() {
    this.multipleBottomSell("DBS", 2);
  }

  tripleTopBuy() {
    this.multipleTopBuy("TTB", 3);
  }

  tripleBottomSell() {
    this.multipleBottomSell("TBS", 3);
  }
}

export default PointFigureChart;
