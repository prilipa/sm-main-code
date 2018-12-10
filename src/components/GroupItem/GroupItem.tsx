import * as React from 'react';

import { GroupItemType, initialState } from './constants';

import generateState from './fsmGroupItem';

import UsualState from './fsmBinding/UsualState';
import UsualAccordeonOpenState from './fsmBinding/UsualAccordeonOpenState';
import HoverState from './fsmBinding/HoverState';
import HoverAccordeonOpenState from './fsmBinding/HoverAccordeonOpenState';
import SaveState from './fsmBinding/SaveState';
import InitialState from './fsmBinding/InitialState';
import EditState from './fsmBinding/EditState';
import AddState from './fsmBinding/AddState';
import ErrorState from './fsmBinding/ErrorState';

import AccordeonSwitcher from '../AccordeonSwitcher';
import AddNewLabel from '../AddNewLabel';
import EditButton from '../EditButton';
import Preloader from '../Preloader';

import './styles.css';

// TODO: Need in future for currentState
// inputs: {
//   [GroupItemType.USUAL]: 0,
//   [GroupItemType.USUAL_ACCORDEON_OPEN]: 1,
//   [GroupItemType.HOVER]: 2,
//   [GroupItemType.HOVER_ACCORDEON_OPEN]: 3,
// },

interface IGroupItemProps {
  itemInitialState: string;
  initialValue: string;
}

interface IGroupItemState {
  currentState: number;
  states: any;
  inputs: {
    ACCORDEON_OPEN: number;
    HOVER: number;
    UN_HOVER: number;
    EDIT_LABEL: number;
    SAVING: number;
    SAVED_DONE: number;
    SAVED_ERROR: number;
    ADD_LABEL: number;
  };
  transitions: any;
  // Old
  name: string;
  machine: {
    isProcessing: boolean;
    isEdit: boolean;
    isHover: boolean;
    isUsual: boolean;
    isInitial: boolean;
    isAccordeonOpen: boolean;
    isAddNew: boolean;
    error: string;
    value: string;
    editValue: string;
  };
  timer: any;
}

/**
 * This component use state machine in this.state,
 * for the change visualization of Accordeon's Group Item.
 *
 * For change item use this states:
 *
 * USUAL -- for usual exist item;
 * USUAL_ACCORDEON_OPEN -- for usual exist item and open accordeon items;
 * HOVER -- for hover on item;
 * HOVER_ACCORDEON_OPEN -- for hover on item and open accordeon items;
 * SAVE -- new item save to DB;
 * INITIAL -- for non presented item;
 * EDIT -- for editing item;
 * ADD -- for create new item;
 * ERROR -- error in item lifecycle;
 * ... -- add other states.
 *
 * Properties for each state:
 *
 * isProcessing: boolean -- some work with DB;
 * isEdit: boolean -- edition mode status;
 * isHover: boolean -- change appearance when hover on item;
 * isUsual: boolean -- for usual appearance;
 * isInitial: boolean -- for initial item appearance;
 * isAccordeonOpen: boolean -- accordeon open or accordeon close;
 * isAddNew: boolean -- appearance for create new item;
 * error: string -- error message from API;
 * value: string -- value of GroupItem;
 * editValue: string -- new value but not saved in DB;
 */
export default class GroupItem extends React.Component<
  IGroupItemProps,
  IGroupItemState
> {
  constructor(props) {
    super(props);

    this.state = {
      currentState: 0,
      states: [
        new UsualState(),
        new UsualAccordeonOpenState(),
        new HoverState(),
        new HoverAccordeonOpenState(),
        new SaveState(),
        new InitialState(),
        new EditState(),
        new AddState(),
        new ErrorState(),
      ],
      inputs: {
        ACCORDEON_OPEN: 0,
        HOVER: 1,
        UN_HOVER: 2,
        EDIT_LABEL: 3,
        SAVING: 4,
        SAVED_DONE: 5,
        SAVED_ERROR: 6,
        ADD_LABEL: 7,
      },
      transitions: [
        [1, 2, 0, 0, 0, 0, 0, 0],
        [0, 3, 1, 1, 1, 1, 1, 1],
        [3, 2, 0, 6, 2, 2, 2, 2],
        [2, 3, 1, 6, 3, 3, 3, 3],
        [4, 4, 4, 4, 4, 4, 8, 4],
        [5, 5, 5, 5, 5, 0, 5, 7],
        [6, 6, 6, 6, 4, 6, 6, 6],
        [7, 7, 7, 7, 4, 7, 7, 7],
        [8, 8, 8, 8, 8, 8, 8, 8],
      ],
      // Old
      name: null,
      machine: { ...initialState },
      timer: null,
    };
  }

  componentDidMount() {
    const { itemInitialState, initialValue } = this.props;

    this.goToState(itemInitialState, initialValue);
  }

  /**
   * State machine binding
   */
  goToState = (stateName, stateParam) => {
    this.setState(generateState(this.state, this.props, stateName, stateParam));
  };

  onAccordeonOpen = () => {
    this.state.states[this.state.currentState].handleAccordeonOpen(this);
  };

  onHover = () => {
    this.state.states[this.state.currentState].handleHover(this);
  };

  onUnHover = () => {
    this.state.states[this.state.currentState].handleUnHover(this);
  };

  onEdit = () => {
    this.state.states[this.state.currentState].handleSave(this, value);
  };

  onAddNew = () => {};

  onSave = value => {
    this.state.states[this.state.currentState].handleSave(this, value);
  };

  onError = () => {};

  onSaveDone = () => {};

  // Transitions
  transitionFromHoverAccordeonOpen = name => {
    const { value } = this.state.machine;

    switch (name) {
      case GroupItemType.HOVER:
        this.goToState(GroupItemType.HOVER_ACCORDEON_OPEN, value);
        break;
      case GroupItemType.HOVER_ACCORDEON_OPEN:
        this.goToState(GroupItemType.HOVER, value);
        break;
      default:
        return null;
    }
  };

  transitionFromHoverAccordeonClose = name => {
    const { value } = this.state.machine;

    switch (name) {
      case GroupItemType.HOVER:
        this.goToState(GroupItemType.USUAL, value);
        break;
      case GroupItemType.HOVER_ACCORDEON_OPEN:
        this.goToState(GroupItemType.USUAL_ACCORDEON_OPEN, value);
        break;
      default:
        return null;
    }
  };

  transitionFromUsual = name => {
    const { value } = this.state.machine;

    switch (name) {
      case GroupItemType.USUAL:
        this.goToState(GroupItemType.HOVER, value);
        break;
      case GroupItemType.USUAL_ACCORDEON_OPEN:
        this.goToState(GroupItemType.HOVER_ACCORDEON_OPEN, value);
        break;
      default:
        return null;
    }
  };

  transitionFromInput = (name, value) => {
    switch (name) {
      case GroupItemType.EDIT:
        this.goToState(GroupItemType.EDIT, value);
        break;
      case GroupItemType.ADD:
        this.goToState(GroupItemType.ADD, value);
        break;
      case GroupItemType.INITIAL:
        this.goToState(GroupItemType.INITIAL, value);
        break;
      case GroupItemType.USUAL:
        this.goToState(GroupItemType.USUAL, value);
        break;
      case GroupItemType.USUAL_ACCORDEON_OPEN:
        this.goToState(GroupItemType.USUAL_ACCORDEON_OPEN, value);
        break;
      default:
        return null;
    }
  };

  transitionEscapeFromInput = (name, value) => {
    switch (name) {
      case GroupItemType.ADD:
        this.goToState(GroupItemType.INITIAL, value);
        break;
      case GroupItemType.EDIT:
        const { isAccordeonOpen } = this.state.machine;

        if (isAccordeonOpen) {
          this.goToState(GroupItemType.USUAL_ACCORDEON_OPEN, value);
        } else {
          this.goToState(GroupItemType.USUAL, value);
        }
        break;
      default:
        return null;
    }
  };
  // State machine binding

  // handleHoverSet = () => {
  //   const { isInitial } = this.state.machine;
  //   const { name } = this.state;

  //   if (isInitial) return;

  //   this.transitionFromUsual(name);
  // };

  // handleHoverUnSet = () => {
  //   const { isInitial } = this.state.machine;
  //   const { name } = this.state;

  //   if (isInitial) return;

  //   this.transitionFromHoverAccordeonClose(name);
  // };

  handleClickInitial = () => {
    const { isInitial } = this.state.machine;

    if (!isInitial) return;

    this.goToState(GroupItemType.ADD, null);
  };

  handleClickEdit = () => {
    const { value } = this.state.machine;

    this.goToState(GroupItemType.EDIT, value);
  };

  // handleClickAccordeonOpen = () => {
  //   const { name } = this.state;

  //   this.transitionFromHoverAccordeonOpen(name);
  // };

  handleInputChange = e => {
    const { name } = this.state;

    this.transitionFromInput(name, e.target.value);
  };

  handleInputKeyDown = e => {
    const { name } = this.state;
    const { value } = this.state.machine;

    if (e.keyCode === 13) {
      if (e.target.value === '') return;

      this.onSave(e.target.value);
    } else if (e.keyCode === 27) {
      this.transitionEscapeFromInput(name, value);
    }
  };

  handleOnFocusInput = e => {
    const valueTemp = e.target.value;
    e.target.value = '';
    e.target.value = valueTemp;
  };

  render() {
    const {
      isInitial,
      isUsual,
      isHover,
      isAccordeonOpen,
      isEdit,
      isProcessing,
      isAddNew,
      value,
      editValue,
    } = this.state.machine;

    console.log('RENDER this.state =', this.state);

    if (isProcessing) {
      return (
        <div className={'wrapper'}>
          <div className={'preloader'}>
            <Preloader />
          </div>
        </div>
      );
      // tslint:disable-next-line:no-else-after-return
    } else {
      return (
        <div
          className={'wrapper'}
          onMouseEnter={this.onHover}
          // onMouseEnter={this.handleHoverSet}
          onMouseLeave={this.onUnHover}
          // onMouseLeave={this.handleHoverUnSet}
          onClick={this.handleClickInitial}
        >
          <div className={'itemLabel'}>
            {/* Label */}
            {isInitial && <div className={'text'}>{value}</div>}
            {isUsual && <div className={'text'}>{value}</div>}
            {isHover && <div className={'text'}>{value}</div>}
            {/* Expand */}
            {isUsual && (
              <AccordeonSwitcher
                handleClickAccordeonOpen={this.onAccordeonOpen}
                // handleClickAccordeonOpen={this.handleClickAccordeonOpen}
                isAccordeonOpen={isAccordeonOpen}
              />
            )}
            {isHover && (
              <AccordeonSwitcher
                handleClickAccordeonOpen={this.onAccordeonOpen}
                // handleClickAccordeonOpen={this.handleClickAccordeonOpen}
                isAccordeonOpen={isAccordeonOpen}
              />
            )}
            {/* Input */}
            {isEdit && (
              <input
                className={'inputEdit'}
                type="text"
                onChange={this.handleInputChange}
                onKeyDown={this.handleInputKeyDown}
                value={editValue}
                autoFocus={true}
                onFocus={this.handleOnFocusInput}
              />
            )}
            {/* Add new label */}
            {isAddNew && (
              <AddNewLabel
                editValue={editValue}
                handleInputChange={this.handleInputChange}
                handleInputKeyDown={this.handleInputKeyDown}
              />
            )}
          </div>
          {/* Edit button */}
          {!isInitial && (
            <EditButton
              isHover={isHover}
              handleClickEdit={this.handleClickEdit}
            />
          )}
        </div>
      );
    }
  }
}
