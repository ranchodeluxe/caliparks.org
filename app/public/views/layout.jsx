import React, {PropTypes} from 'react';
import {IntlProvider, addLocaleData} from 'react-intl';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import {Provider} from 'react-redux';
import UserVoice from  '../components/userVoice';
import GoogleAnalytics from  '../components/googleAnalytics';

import makeStore from '../store';

addLocaleData(en);
addLocaleData(es);

export default class Layout extends React.Component {
  static propTypes = {
    lang: PropTypes.string.isRequired,
    messages: PropTypes.object,
    title: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.node
    ]).isRequired,
    selectedPark: PropTypes.object,
    location: PropTypes.object,
    viewData: PropTypes.object,
    baseUrl: PropTypes.string,
    gaID: PropTypes.string
  };

  constructor(props) {
    super(props);

    // seed the redux state with initial properties
    this.store = makeStore(props);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  renderMetaTags() {
    const location = this.props.baseUrl + this.props.location.pathname;
    const path = this.props.location.pathname.split('/');
    let image = this.props.baseUrl + this.props.viewData.header[0];
    let title = this.props.title;
    if (path.length > 1 && path[1] === 'park' && this.props.selectedPark && this.props.selectedPark.images && this.props.selectedPark.images.length) {
      image = this.props.selectedPark.images[0].standard_resolution;
      title += ' : ' + this.props.selectedPark.park[0].su_name;
    }
    return [
      <meta key={'og:url'} property='og:url' content={location} />,
      <meta key={'twitter:url'} name='twitter:url' content={location} />,
      <meta key={'og:title'} property='og:title' content={title} />,
      <meta key={'twitter:title'} name='twitter:title' content={title} />,
      <meta key={'twitter:image'} name='twitter:image' content={image} />,
      <meta key={'og:image'} property='og:image' content={image} />
    ];
  }

  render() {
    const description = 'Find national, state, county and city parks near you in California. See real-time park photos from Instagram, get information and directions, and make reservations.';
    return (
        <Provider store={this.store}>
          <html lang={this.props.lang}>
            <head>
              <meta charSet='utf-8' />
              <title>{this.props.title}</title>
              <meta name='viewport' content='width=device-width, initial-scale=1' />
              <meta property='fb:app_id' content='1234567890' />
              <meta name='description' content={description}/>
              <meta name='twitter:description' content={description}/>
              {this.renderMetaTags()}
              <link rel='apple-touch-icon' sizes='57x57' href='/assets/icons/apple-touch-icon-57x57.png'/>
              <link rel='apple-touch-icon' sizes='60x60' href='/assets/icons/apple-touch-icon-60x60.png'/>
              <link rel='apple-touch-icon' sizes='72x72' href='/assets/icons/apple-touch-icon-72x72.png'/>
              <link rel='apple-touch-icon' sizes='76x76' href='/assets/icons/apple-touch-icon-76x76.png'/>
              <link rel='apple-touch-icon' sizes='114x114' href='/assets/icons/apple-touch-icon-114x114.png'/>
              <link rel='apple-touch-icon' sizes='120x120' href='/assets/icons/apple-touch-icon-120x120.png'/>
              <link rel='apple-touch-icon' sizes='144x144' href='/assets/icons/apple-touch-icon-144x144.png'/>
              <link rel='apple-touch-icon' sizes='152x152' href='/assets/icons/apple-touch-icon-152x152.png'/>
              <link rel='apple-touch-icon' sizes='180x180' href='/assets/icons/apple-touch-icon-180x180.png'/>
              <link rel='icon' type='image/png' href='/assets/icons/favicon-32x32.png' sizes='32x32'/>
              <link rel='icon' type='image/png' href='/assets/icons/favicon-194x194.png' sizes='194x194'/>
              <link rel='icon' type='image/png' href='/assets/icons/favicon-96x96.png' sizes='96x96'/>
              <link rel='icon' type='image/png' href='/assets/icons/android-chrome-192x192.png' sizes='192x192'/>
              <link rel='icon' type='image/png' href='/assets/icons/favicon-16x16.png' sizes='16x16'/>
              <link rel='manifest' href='/assets/icons/manifest.json'/>
              <link rel='mask-icon' href='/assets/icons/safari-pinned-tab.svg' color='#5bbad5'/>
              <link rel='shortcut icon' href='/favicon.ico?v=2' type='image/x-icon'/>
              <meta name='msapplication-TileColor' content='#da532c'/>
              <meta name='msapplication-TileImage' content='/mstile-144x144.png'/>
              <meta name='msapplication-config' content='/assets/icons/browserconfig.xml'/>
              <meta name='theme-color' content='#ffffff'/>

              <link href='//fonts.googleapis.com/css?family=Lato:400,300,900,700' rel='stylesheet' type='text/css'/>
              <link rel='stylesheet' type='text/css' href='//cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.3.15/slick.css' />
              <link rel='stylesheet' type='text/css' href='/styles.css' />

              <script src='https://cdn.polyfill.io/v2/polyfill.min.js?features=Intl,Intl.~locale.en,Intl.~locale.es'></script>
              <script src='https://maps.googleapis.com/maps/api/js'></script>
            </head>
            <body>
              <IntlProvider locale={this.props.lang} messages={this.props.messages}>
                { this.props.children }
              </IntlProvider>
              <GoogleAnalytics trackingID={this.props.gaID || null} />
              <UserVoice locale={this.props.lang} />
              <script src='/vendor/js/addtohomescreen_modified.min.js'></script>
              <script dangerouslySetInnerHTML={{__html: 'addToHomescreen({skipFirstVisit: true, maxDisplayCount: 1});'}} />
              <script src='/vendor/js/svg4everybody.min.js'></script>
              <script>svg4everybody();</script>
              <script src='/bundle.js'></script>
            </body>
          </html>
        </Provider>
    );
  }
}
