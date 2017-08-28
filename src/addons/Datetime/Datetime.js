import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import React from 'react'

import {
  AutoControlledComponent as Component,
  customPropTypes,
  dateUtils,
  makeDebugger,
  META,
} from '../../lib'

import Input from '../../elements/Input/Input'
import Popup from '../../modules/Popup'

import Calendar from './Calendar'
import CalendarMenu from './CalendarMenu'
import DateRange from './DateRange'

const debug = makeDebugger('datetime')

// Allow the table and menu to create the borders
const popupStyle = {
  border: 'none',
  padding: 0,
}

/**
 * A <Datetime/> allows a user to select a calendar date and/or time as well
 * as handle date ranges.
 * @see Form
 */
export default class Datetime extends Component {
  static _meta = {
    name: 'Datetime',
    type: META.TYPES.ADDON,
  }

  static Range = DateRange

  static propTypes = {
    /** An element type to render as (string or function). */
    as: customPropTypes.as,

    /** Enables date selection. */
    date: PropTypes.bool,

    /** Disables the input element. */
    disabled: PropTypes.bool,

    /** An array of dates that should be marked disabled in the calendar. */
    disabledDates: PropTypes.arrayOf(customPropTypes.DateValue),

    /** Initial value of open. */
    defaultOpen: PropTypes.bool,

    /** Initial value as a Date object or a string that can be parsed into one. */
    defaultValue: customPropTypes.DateValue,

    /** An errored dropdown can alert a user to a problem. */
    error: PropTypes.bool,

    /** First day of the week. Can be either 0 (Sunday), 1 (Monday) * */
    firstDayOfWeek: PropTypes.number,

    /** Shorthand for Icon. */
    icon: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.object,
    ]),

    /** Do not allow dates after maxDate. */
    maxDate: customPropTypes.DateValue,

    /** Do not allow dates before minDate. */
    minDate: customPropTypes.DateValue,

    /** Name of the input field which holds the date value. */
    name: PropTypes.string,

    /**
     * Called when the user changes the value.
     *
     * @param {SyntheticEvent} event - React's original SyntheticEvent.
     * @param {object} data - All props and proposed value.
     */
    onChange: PropTypes.func,

    /**
     * Called when a close event happens.
     *
     * @param {SyntheticEvent} event - React's original SyntheticEvent.
     * @param {object} data - All props.
     */
    onClose: PropTypes.func,

    /**
     * Called when an open event happens.
     *
     * @param {SyntheticEvent} event - React's original SyntheticEvent.
     * @param {object} data - All props.
     */
    onOpen: PropTypes.func,

    /** Controls whether or not the dropdown menu is displayed. */
    open: PropTypes.bool,

    /** Placeholder text. */
    placeholder: PropTypes.string,

    /** Render two calendars for selecting the start and end of a range. */
    range: PropTypes.bool,

    /** Enables time selection. */
    time: PropTypes.bool,

    /**
     * Formats the date string in the input and calendar.
     * A function that receives a date argument and returns a formatted date
     * @param {date} - A date object.
     */
    dateFormatter: PropTypes.func,
    /**
     * Formats the time string in the input and calendar.
     * The function receives a date arguments and should return a string
     * formatted time.
     * @param {date} - A date object.
     */
    timeFormatter: PropTypes.func,
    /**
     * Formats an hour for display in the hour selection.
     * A function that receives a date argument and returns a formatted
     * rounded hour.
     */
    hourFormatter: PropTypes.func,
    /** Current value as a Date object or a string that can be parsed into one. */
    value: customPropTypes.DateValue,
    timeZone: PropTypes.string,
    defaultMode: PropTypes.string,
    mode: PropTypes.string,
  }

  static autoControlledProps = [
    'open',
    'value',
    'mode',
  ]

  static defaultProps = {
    icon: 'calendar',
    dateFormatter: dateUtils.defaultDateFormatter,
    timeFormatter: dateUtils.defaultTimeFormatter,
    hourFormatter: dateUtils.defaultHourFormatter,
    date: true,
    time: true,
  }

  state = {
    value: new Date(),
  }

  componentWillMount() {
    this.trySetState({ mode: this.getInitialMode() })
  }

  getInitialMode() {
    const { date, time } = this.props
    return !date && time ? 'hour' : 'day'
  }

  open = (e) => {
    debug('open()')
    _.invoke('onOpen', this.props, e, this.props)

    this.trySetState({ open: true })
  }

  close = (e) => {
    debug('close()')
    _.invoke('onClose', this.props, e, this.props)

    this.trySetState({ open: false, mode: this.getInitialMode() })
  }

  toggle = e => (this.state.open ? this.close(e) : this.open(e))

  handleChange = (e, { value, mode }) => {
    debug('handleChange()', value, e)
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    this.trySetState({ value, mode })
    _.invoke('onChange', this.props, e, { ...this.props, value })

    // when there's no mode, the selection process has ended
    if (!mode) this.close()
  }

  handleChange = (e, { value }) => {
    debug('handleMonthChange()', value, mode)
    this.trySetState({ value, mode })
  }

  /**
   * Return a formatted date or date/time string
   */
  getFormattedDate(value = this.state.value) {
    debug('getFormattedDate()', value)
    const { date, dateFormatter, time, timeFormatter } = this.props

    if (date && time) return `${dateFormatter(value)} ${timeFormatter(value)}`

    if (!date && time) return timeFormatter(value)

    return dateFormatter(value)
  }

  handlePreviousPage = (e) => {
    this.setPage(e, -1)
  }

  handleNextPage = (e) => {
    this.setPage(e, 1)
  }

  setPage = (e, count) => {
    const { mode, value } = this.props

    e.stopPropagation()

    switch (mode) {
      case 'day':
        this.setMonth(e, { page: count })
        break

      case 'month':
        this.setYear(e, value.getFullYear() + count, mode)
        break

      case 'year':
        this.setYear(e, value.getFullYear() + (count * 16), mode)
        break

      default:
        break
    }
  }

  handleChangeMode = (e, { name }) => {
    _.invoke('onChange', this.props, e, { ...this.props, mode: name })
  }

  setMonth = (e, props) => {
    const { value, page } = props
    const mode = 'day'
    const month = !value && page
      ? value.getMonth() + page
      : value

    value.setMonth(month)
    _.invoke('onChange', this.props, e, { ...this.props, value, mode })
  }

  setDay = (e, day) => {
    const { time, value } = this.props

    value.setDate(day)

    const mode = time ? 'hour' : null
    _.invoke('onChange', this.props, e, { ...this.props, value, mode })
  }

  setYear = (e, year, mode = 'day') => {
    const { value } = this.props

    value.setYear(year)
    _.invoke('onChange', this.props, e, { ...this.props, value, mode })
  }

  setHour = (e, hour, mode = 'minute') => {
    const { value } = this.props

    value.setHours(hour)
    _.invoke('onChange', this.props, e, { ...this.props, value, mode })
  }

  setMinute = (e, minute, mode = null) => {
    const { value } = this.props

    value.setMinutes(minute)
    _.invoke('onChange', this.props, e, { ...this.props, value, mode })
  }

  render() {
    debug('render state', this.state)
    const {
      disabled,
      error,
      firstDayOfWeek,
      icon,
      name,
      placeholder,
      time,
      date,
      dateFormatter,
      timeFormatter,
      hourFormatter,
      minDate,
      disabledDates,
    } = this.props

    const { open, value, mode } = this.state

    return (
      <Popup
        closeOnDocumentClick
        // TODO: Fix close on trigger blur, it closes when clicking inside the calendar.
        // Calendar contents are changed on click, so Popup cannot find the clicked node within calendar.
        // If the clicked node is not within the Portal, it is considered a "blur" and closes.
        // Enable close on trigger blur after this is fixed.
        // Portal should be able to identify clicks within the portal even with no e.target, perhaps using x y coords.
        closeOnTriggerBlur={false}
        closeOnTriggerClick={false}
        closeOnTriggerMouseLeave={false}
        openOnTriggerClick={false}
        openOnTriggerFocus
        openOnTriggerMouseEnter={false}
        onClose={this.close}
        onOpen={this.open}
        open={open}
        position='bottom left'
        style={popupStyle}
        trigger={(
          <Input
            type='text'
            name={name}
            icon={icon}
            disabled={disabled}
            error={error}
            iconPosition='left'
            placeholder={placeholder}
            value={this.getFormattedDate(value)}
          />
        )}
      >
        <CalendarMenu
          mode={mode}
          onChangeMode={this.handleChangeMode}
          onNextPage={this.handleNextPage}
          onPreviousPage={this.handlePreviousPage}
          value={value}
        />
        <Calendar
          date={date}
          dateFormatter={dateFormatter}
          disabledDates={disabledDates}
          firstDayOfWeek={firstDayOfWeek}
          hourFormatter={hourFormatter}
          minDate={minDate}
          mode={mode}
          onChange={this.handleChange}

          // TODO remove these for one onChange???
          onDayChange={this.handleDayChange}
          onMonthChange={this.handleMonthChange}
          onYearChange={this.handleYearChange}
          onHourChange={this.handleHourChange}
          onMinuteChange={this.handleMinuteChange}

          time={time}
          timeFormatter={timeFormatter}
          value={value}
        />
      </Popup>
    )
  }
}
