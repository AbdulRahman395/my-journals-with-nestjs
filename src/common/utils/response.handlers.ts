import { Response } from 'express';

// Define the success response function
export const useSuccessResponse = async (
    res: Response,
    message: string,
    data: any,
    statusCode: number = 200
): Promise<Response> => {
    return res.status(statusCode).json({
        message,
        success: true,
        data,
    });
};

// Define the error response function
export const useErrorResponse = async (
    res: Response,
    message: string,
    statusCode: number
): Promise<Response> => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

// Define the error response function
export const useInterServerErrorResponse = async (
    res: any,
    error: string,
): Promise<Response> => {
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error
    });
};
