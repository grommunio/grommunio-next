// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { CirclePicker } from 'react-color';

const CategoryColorPicker = ({...pickerProps}) => {
  return <CirclePicker
    colors={["#ff0000", "#ffa500", "#ffff00", "#008000", "#0000ff", "#800080"] /* TODO: Add all preset colors */}
    {...pickerProps}
  />
}

export default CategoryColorPicker;