import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import DownshiftPelias from 'downshift-pelias'
import Pelias from 'pelias-js'
import { injectIntl, intlShape } from 'react-intl'
import { PELIAS_HOST_NAME, PELIAS_API_KEY } from '../../app/config'
import { setMapState } from '../../store/actions/map'

class GeoSearch extends React.Component {
  static propTypes = {
    intl: intlShape.isRequired,
    setMapState: PropTypes.func,
    setSearchResults: PropTypes.func,
    focus: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }).isRequired
  }

  static defaultProps = {
    focus: { lat: 0, lng: 0 }
  }

  constructor (props) {
    super(props)

    this.pelias = new Pelias({ peliasUrl: `https://${PELIAS_HOST_NAME}`, apiKey: PELIAS_API_KEY })
    this.inputEl = React.createRef()
  }

  onClickClearSearch = (clearSelection) => {
    clearSelection()
    this.inputEl.current.focus()
  }

  handleChange = (selection) => {
    if (!selection) return

    this.props.setMapState({
      addressInformation: selection.properties,
      markerLocation: {
        lat: selection.geometry.coordinates[1],
        lng: selection.geometry.coordinates[0]
      }
    })

    this.props.setSearchResults(selection.geometry.coordinates.reverse(), selection.properties.label, selection.bbox)
    this.inputEl.current.focus()
  }

  render () {
    const { focus } = this.props

    this.pelias.search.setBoundaryCircle({ lat: focus.lat, lon: focus.lng, radius: 10 })
    this.pelias.autocomplete.setFocusPoint({ lat: focus.lat, lon: focus.lng })

    return (
      <DownshiftPelias pelias={this.pelias} onChange={this.handleChange}>
        {({
          getInputProps,
          getMenuProps,
          getItemProps,
          clearSelection,
          inputValue,
          isOpen,
          results
        }) => (
          <div className="geotag-input-form">
            <input {...getInputProps({
              className: 'geotag-input',
              autoFocus: true,
              ref: this.inputEl,
              placeholder: this.props.intl.formatMessage({ id: 'dialogs.geotag.search', defaultMessage: 'Search for a location' })
            })} />
            { inputValue && (
              <span
                title={this.props.intl.formatMessage({ id: 'dialogs.geotag.clear-search', defaultMessage: 'Clear search' })}
                className="geotag-input-clear"
                onClick={() => { this.onClickClearSearch(clearSelection) }}
              >
                ×
              </span>
            )}
            { isOpen && results && results.features.length > 0 && (
              <div className="geotag-suggestions-container">
                <ul {...getMenuProps({
                  className: 'geotag-suggestions-list'
                })}>
                  {
                    results.features.map((item, index) => (
                      <li {...getItemProps({
                        className: 'geotag-suggestion',
                        key: item.properties.gid,
                        index,
                        item
                      })}>
                        { item.properties.label }
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}
          </div>
        )}
      </DownshiftPelias>
    )
  }
}

// Inject Intl via a higher-order component provided by react-intl.
// Exported so that this component can be tested.
export const GeoSearchWithIntl = injectIntl(GeoSearch)

function mapStateToProps (state) {
  return {
    markerLocation: state.map.markerLocation,
    addressInformation: state.map.addressInformation
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setMapState: (...args) => { dispatch(setMapState(...args)) }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GeoSearchWithIntl)
