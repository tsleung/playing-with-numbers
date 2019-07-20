'use strict';

export class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return React.createElement('div',{} , []);
    //new reactVis.XYPlot({});
    // `<XYPlot
    //   width={300}
    //   height={300}>
    //   <HorizontalGridLines />
    //   <LineSeries
    //     data={[
    //       {x: 1, y: 10},
    //       {x: 2, y: 5},
    //       {x: 3, y: 15}
    //     ]}/>
    //   <XAxis />
    //   <YAxis />
    // </XYPlot>`
  }
}
