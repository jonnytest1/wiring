import { InjectionToken } from '@angular/core';
import type { JscppInclude } from './wirings/microprocessor/code-processor/c++-lib/jscpp';
import type { Esp32Provides } from './wirings/microprocessor/esp32';

export const esp32LibraryToken = new InjectionToken<Esp32Provides>("esp32_library")