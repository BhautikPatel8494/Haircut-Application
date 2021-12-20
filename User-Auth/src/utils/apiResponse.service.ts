import { Injectable } from '@nestjs/common';
import { Response } from "express";

@Injectable()
export class ApiResponse {
  successResponse(res: Response, msg: String) {
    var resData = {
      status: 200,
      message: msg,
    };
    return res.status(200).json(resData);
  }

  successResponseWithData(res: Response, msg: String, data: Object) {
    var resData = {
      status: 200,
      message: msg,
      data: data,
    };
    return res.status(200).json(resData);
  }

  successResponseWithExtraData(res: Response, msg: String, extraData: Object, data: Object) {
    var resData = {
      status: 200,
      message: msg,
      extraData,
      data: data,
    };
    return res.status(200).json(resData);
  }

  successResponseWithCustomKeyName(res: Response, msg: String, data: Object) {
    var resData = {
      status: 200,
      message: msg,
      user_exists: data
    };
    return res.status(200).json(resData);
  }

  successResponseWithNoData(res: Response, msg: String) {
    var resData = {
      status: 200,
      message: msg,
    };
    return res.status(200).json(resData);
  }

  ErrorResponse(res: Response, msg: String, data: Object) {
    var resData = {
      status: 400,
      message: msg,
      data: data,
    };
    return res.status(400).json(resData);
  }

  ErrorResponseWithExtraData(res: Response, msg: String, extradata: Object, data: Object) {
    var resData = {
      status: 400,
      message: msg,
      extraData: extradata,
      data: data,
    };
    return res.status(400).json(resData);
  }

  ErrorResponseWithoutData(res: Response, msg: String) {
    var resData = {
      status: 400,
      message: msg,
    };
    return res.status(400).json(resData);
  }

  notFoundResponse(res: Response, msg: String, data: Object) {
    var resData = {
      status: 404,
      message: msg,
      data: data,
    };
    return res.status(404).json(resData);
  }

  notFoundResponseWithExtraData(res: Response, msg: String, extradata: Object, data: Object) {
    const resData = {
      status: 404,
      message: msg,
      extraData: extradata,
      data: data,
    };
    return res.status(404).json(resData);
  }

  notFoundResponseWithNoData(res: Response, msg: String) {
    var resData = {
      status: 404,
      message: msg,
    };
    return res.status(404).json(resData);
  }

  validationErrorWithData(res: Response, msg: String, data: Object) {
    var resData = {
      status: 422,
      message: msg,
      data: data,
    };
    return res.status(422).json(resData);
  }

  validationError(res: Response, msg: String) {
    var resData = {
      status: 422,
      message: msg,
    };
    return res.status(422).json(resData);
  }

  unauthorizedResponse(res: Response, msg: String, data: Object) {
    var resData = {
      status: 401,
      message: msg,
      data: data,
    };
    return res.status(401).json(resData);
  }

  unauthorizedResponseWithoutData(res: Response, msg: String) {
    var resData = {
      status: 401,
      message: msg,
    };
    return res.status(401).json(resData);
  }
}
