import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import PureComponent from 'react-pure-render/component';
import {GoogleMap} from 'react-google-maps';
import CustomTileLayer from '../components/customTileLayer';
import GmapDataLayer from  '../components/gmapDataLayer';
import GmapControls from './gmapControls';
import GmapMarkerClusterer from './gmapMarkerClusterer';
import {debounce} from 'lodash';

export default class ParkMap extends PureComponent {
  static propTypes = {
    geometry: PropTypes.object,
    shouldResize: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.bool
    ]),
    onBoundsChange: PropTypes.func
  };

  componentWillMount() {
    this.handleBoundsChangeDebounced = debounce(this.handleBoundsChange, 500).bind(this);
  }

  componentDidMount() {
    this.resizeMap();
  }

  componentDidUpdate(prevProps) {
    if (this.props.shouldResize !== prevProps.shouldResize) this.resizeMap();
  }

  resizeMap() {
    if (this.refs.map &&
      typeof window !== 'undefined'
    ) {
      const map = ReactDOM.findDOMNode(this.refs.map);
      window.google.maps.event.trigger(map, 'resize');
    }
  }

  handleBoundsChange() {
    if (typeof this.props.onBoundsChange === 'function') {
      const bds = this.refs.map.getBounds().toUrlValue(4).split(',');
      this.props.onBoundsChange(bds);
    }
  }

  render() {
    const hasGeometry = this.props.geometry !== null ? true : false;
    return (
      <GoogleMap ref='map' containerProps={{
        style: {
          height: '100%',
        },
      }}
        defaultZoom={6}
        defaultOptions={{
          streetViewControl: false,
          scrollwheel: false,
          mapTypeControl: false,
          zoomControl: false
        }}
        defaultCenter={{lat: 37.735969, lng: -121.640625}}
        onBoundsChanged={this.handleBoundsChangeDebounced.bind(this)}>
        <CustomTileLayer tileUrl='http://{s}.map.parks.stamen.com/{z}/{x}/{y}{r}.png' {...this.props} />
        <GmapControls {...this.props} />

        {hasGeometry &&
          <GmapDataLayer geometry={this.props.geometry} />
        }

        <GmapMarkerClusterer {...this.props} />
      </GoogleMap>
    );
  }
}
