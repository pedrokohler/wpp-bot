import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  public pipe(...funcs) {
    return (x) => funcs.reduce((res, func) => func(res), x);
  }
}
