import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {
  customPropTypes,
  dateUtils,
  META,
} from '../../lib'

import DatetimeGrid from './DatetimeGrid'

/**
 * A day cell within a calendar month
 */
export default class Hours extends Component {
  static propTypes = {
    /**
     * Formats a Date object as an hour string.
     *
     * @param {date} - A date object.
     * @returns {string} - A formatted hour string.
     */
    formatter: PropTypes.func,

    /**
     * Called when the user changes the value.
     *
     * @param {SyntheticEvent} event - React's original SyntheticEvent.
     * @param {object} data - All props and proposed value.
     * @param {object} data.value - The proposed new value.
     */
    onChange: PropTypes.func,

    /** Current value as a Date object. */
    value: customPropTypes.DateValue,
  }

  static _meta = {
    name: 'Hours',
    parent: 'Datetime',
    type: META.TYPES.MODULE,
  }

  static defaultProps = {
    formatter: dateUtils.defaultHourFormatter,
  }

  getCells = () => _.map(_.range(0, 12), hour => ({
    content: this.getHourLabel(hour),
    onClick: this.handleCellClick(hour),
  }), 12)

  getHourLabel = (hour) => {
    const { formatter, value } = this.props
    const date = new Date(value)

    date.setMinutes(0)
    date.setHours(hour)

    return formatter(date)
  }

  handleCellClick = hours => (e) => {
    const value = new Date(this.props.value)
    value.setHours(hours)

    _.invoke('onChange', this.props, e, { ...this.props, value })
  }

  render() {
    return (
      <DatetimeGrid
        headers={['Hour']}
        columns={4}
        cells={this.getCells()}
      />
    )
  }
}
