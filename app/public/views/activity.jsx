import PureComponent from 'react-pure-render/component';
import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import { Link } from 'react-router';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {throttle, uniq} from 'lodash';
import * as actions from '../actions';

import Footer from '../partials/footer';
import StickyNav from '../partials/sticky-nav';
import ParkMap from '../components/parkMap';
import { helpers } from '../../constants/park-activities';
import Navigator from '../components/navigator';

import {MOBILE_BREAKPOINT} from '../../constants/layout';
import {getTwoColumnWidthPercent} from '../../constants/layout';


function mapStateToProps(state) {
  return state;
}

export class Activity extends PureComponent {
  static propTypes = {
    params: PropTypes.shape({
      activity: PropTypes.string.isRequired
    }).isRequired,
    selectedActivity: PropTypes.shape({
      parks: PropTypes.array.isRequired,
      isFetching: PropTypes.bool,
      activity: PropTypes.string
    }).isRequired,
    windowSize: PropTypes.object,
    setWindowSize: PropTypes.func,
    clearSelectedActivityData: PropTypes.func,
    fetchSelectedActivity: PropTypes.func,
    intl: intlShape.isRequired
  };

  state = {
    selectedMarker: 0,
    selectedIndex: 0,
    tabSection: 'map',
    hovered: null
  };

  componentWillMount() {
    this.setSelectedMarkerIfEmpty(this.props);
  }

  componentDidMount() {
    this.handleResizeThrottled = throttle(this.handleResize, 250).bind(this);
    window.addEventListener('resize', this.handleResizeThrottled);
    this.handleResize();

    const {params, selectedActivity, fetchSelectedActivity} = this.props;
    if (!selectedActivity.isFetching) {
      if (!selectedActivity.parks ||
          selectedActivity.parks.length === 0 ||
          selectedActivity.activity !== params.activity) {
        fetchSelectedActivity(params.activity);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setSelectedMarkerIfEmpty(nextProps);
  }

  componentDidUpdate(prevProps, prevState) {
    this.setScrollContainerHeight();
    if ((this.state.tabSection !== prevState.tabSection && this.state.tabSection === 'list') || prevState.selectedMarker !== this.state.selectedMarker && !this.isFromListClick) {
      this.setScrollPosition();
    }
    this.isFromListClick = false;
  }

  componentWillUnmount() {
    this.props.clearSelectedActivityData(this.props.params.activity);
    window.removeEventListener('resize', this.handleResizeThrottled);
  }

  getWindowDimensions() {
    // Need to make sure we have a window due to
    // server rendering...
    if (typeof window === 'undefined') return {width: 0, height: 0};

    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  handleResize() {
    this.props.setWindowSize(this.getWindowDimensions());
  }

  getHeight() {
    if (!this.props.windowSize.height || !this.refs.sectionmap || !this.refs.smallscreenheight) return 700;


    if (this.props.windowSize.width < MOBILE_BREAKPOINT) {
      return this.props.windowSize.height - this.refs.smallscreenheight.offsetTop - 40;
    }

    return this.props.windowSize.height - this.refs.sectionmap.offsetTop - 20;
  }

  setScrollPosition() {
    if (!this.state.selectedMarker) return;
    const container = ReactDOM.findDOMNode(this.refs.parklist);
    const selected = ReactDOM.findDOMNode(this.refs[this.state.selectedMarker]);
    container.scrollTop = selected.offsetTop - container.offsetTop;
    this.isFromListClick = false;
  }

  setScrollContainerHeight() {
    if (!this.refs.parklist) return;
    const elm = ReactDOM.findDOMNode(this.refs.parklist);
    elm.style.height = (this.props.windowSize.height - elm.offsetTop - 40) + 'px';
  }

  onMarkerClick(marker, idx) {
    const id = this.setMarkerId(marker);
    if (this.state.selectedMarker === id) return;
    this.isFromListClick = false;
    this.setState({selectedMarker: id, selectedIndex: idx});
  }

  onListClick(id, idx) {
    if (this.state.selectedMarker === id) return;
    this.isFromListClick = true;
    this.setState({selectedMarker: id, selectedIndex: idx});
  }

  onListMouseOver(id, idx) {
    if (this.state.hovered === id) return;
    // this.setState({hovered: idx});
  }
  onListMouseOut(id, idx) {
    if (this.state.hovered !== id) return;
    // this.setState({hovered: null});
  }

  onBoundsChange(bounds) {
    if (bounds.length !== 4) return;
    const {params, selectedActivity, fetchSelectedActivity} = this.props;
    if (selectedActivity.isFetching) return;
    this.boundsChange = true;
    fetchSelectedActivity(params.activity, [bounds[1], bounds[0], bounds[3], bounds[2]]);
  }

  setSelectedMarkerIfEmpty(props) {
    const {selectedActivity} = props;
    if (selectedActivity.isFetching || !selectedActivity.parks.length) return;

    if (this.state.selectedMarker === 0 || this.boundsChange) {
      this.boundsChange = false;
      const containsPark = selectedActivity.parks.filter((park) => {
        return park.su_id === this.state.selectedMarker;
      });

      if (this.state.selectedMarker === 0 || containsPark.length === 0) {
        this.setState({
          selectedMarker: selectedActivity.parks[0].su_id,
          selectedIndex: 0
        });
      }
    }
  }

  setMarkerIcon(marker, idx) {
    // circle icon path generator:
    // http://complexdan.com/svg-circleellipse-to-path-converter/
    const icon = {
      scale: 1,
      fillOpacity: 1,
      strokeOpacity: 1
    };

    if (marker.su_id === this.state.selectedMarker || marker.su_id === this.state.hovered) {
      icon.path = 'M-4,0a4,4 0 1,0 8,0a4,4 0 1,0 -8,0';
      icon.fillColor = '#ffffff';
      icon.strokeColor = '#358292';
      icon.strokeWeight = 2;
    } else {
      icon.path = 'M-5,0a5,5 0 1,0 10,0a5,5 0 1,0 -10,0';
      icon.fillColor = '#358292';
      icon.strokeColor = '#358292';
      icon.strokeWeight = 0;
    }
    return icon;
  }

  setMarkerId(marker, idx) {
    return marker.su_id;
  }

  setMarkerPosition(marker, idx) {
    return {lat: marker.centroid.coordinates[1], lng: marker.centroid.coordinates[0]};
  }

  setMarkerZindex(marker, idx) {
    return (this.state.selectedMarker === marker.su_id || this.state.hovered === marker.su_id) ? 1000 + idx : idx;
  }

  onTabChange(val) {
    if (val === this.state.tabSection) return;
    this.setState({tabSection: val});
  }

  getTabBtnClass(val) {
    const active = val === this.state.tabSection ? ' active' : '';
    return 'btn' + active;
  }

  render() {
    const {formatMessage} = this.props.intl;
    const icon = helpers.iconprefix + this.props.params.activity;
    const [leftWidth, rightWidth] = getTwoColumnWidthPercent(this.props.windowSize.width, 20);

    // TODO: How to handle parks with multiple entry points
    // which creates duplicate parks
    const uniqueParks = uniq(this.props.selectedActivity.parks, true, 'su_id');
    return (
      <div id='activity' className={'container tab-' + this.state.tabSection}>
        <main className='page-activity' role='application'>
          <StickyNav className='white' />

          <div className='row content'>
            <div className='col col-four height-full' style={{width: leftWidth + '%'}}>
              <div className='activity-hero'>
                <div className='small-hero'>
                  <h4 className='uppercase'>
                    <FormattedMessage
                      id='discover'
                      defaultMessage='Discover'
                    />
                  </h4>
                  <p className='uppercase font-small'>{helpers.title(this.props.params.activity, formatMessage)}</p>
                </div>
                <img src={'/assets/images/activities/' + this.props.params.activity + '_square.jpg'} />
                <div className='activity-logo'>
                  <svg className={'icon alt large park-activity ' + this.props.params.activity}>
                    <use xlinkHref={icon} />
                  </svg>
                  <Link to='/' hash='#discover'>
                    <span>&lt; </span>
                    <FormattedMessage
                      id='activity-page.back'
                      defaultMessage='Back to activities' />
                  </Link>
                </div>
              </div>
              <div className='tabs'>
                <div className='tabs-inner'>
                  <button className={this.getTabBtnClass('list')} onClick={this.onTabChange.bind(this, 'list')}>
                    <FormattedMessage
                      id='tab.listview'
                      defaultMessage='List View' />
                  </button>
                  <button className={this.getTabBtnClass('map')} onClick={this.onTabChange.bind(this, 'map')}>
                    <FormattedMessage
                      id='tab.mapview'
                      defaultMessage='Map View' />
                  </button>
                </div>
              </div>
              <div ref='smallscreenheight' />
              <div id='section-list' className='inset'>
                <h4 className='title uppercase'>{helpers.title(this.props.params.activity, formatMessage)}</h4>

                <ul ref='parklist' className='park-list'>
                {uniqueParks.map((park, index) => {
                  return (
                    <li
                      key={park.su_id}
                      ref={park.su_id}
                      className={(this.state.selectedMarker === park.su_id) ? 'selected' : ''}
                      onClick={this.onListClick.bind(this, park.su_id, index)}
                      onMouseOver={this.onListMouseOver.bind(this, park.su_id, index)}
                      onMouseOut={this.onListMouseOut.bind(this, park.su_id, index)}>
                      <span>{park.su_name}</span>
                      <a href={'/park/' + park.su_id}>&gt;</a>
                    </li>
                  );
                })}
                </ul>
              </div>
            </div>
            <div id='section-map' ref='sectionmap' className='col col-eight map-wrap pos-relative' style={{width: rightWidth + '%', height: this.getHeight() + 'px'}}>
              {this.props.selectedActivity.isFetching &&
                <div className='loading-data'>
                  <h3>
                    <FormattedMessage
                        id='loading.parks'
                        defaultMessage={`Loading parks...`} />
                  </h3>
                </div>
              }
              <ParkMap
                cluster={true}
                shouldResize={this.props.windowSize.width + this.props.windowSize.height}
                markers={uniqueParks}
                selectedMarker={this.state.selectedMarker}
                setMarkerIcon={this.setMarkerIcon.bind(this)}
                setMarkerId={this.setMarkerId.bind(this)}
                setMarkerPosition={this.setMarkerPosition.bind(this)}
                setMarkerZindex={this.setMarkerZindex.bind(this)}
                onMarkerClick={this.onMarkerClick.bind(this)}
                onBoundsChange={this.onBoundsChange.bind(this)} />

              <Navigator
                items={uniqueParks}
                selectedItem={this.state.selectedIndex}
                nameKey={'su_name'}
                idKey={'su_id'} />
            </div>
          </div>
        </main>
        <div>
          <div className='scroll-helper-arrow down no-arrow'/>
          <Footer lang={this.props.lang} />
        </div>
      </div>
    );
  }
}

export const ActivityContainer = injectIntl(connect(mapStateToProps, actions)(Activity));
