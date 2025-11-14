declare module 'react-datepicker' {
  import * as React from 'react';
  const DatePicker: React.ComponentType<any>;
  export default DatePicker;
}

declare module 'luxon' {
  export type Duration = any;
  export const Duration: any;
  export const DateTime: any;
  export const Interval: any;
}
