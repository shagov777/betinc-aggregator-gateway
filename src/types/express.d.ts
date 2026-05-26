declare module "express" {
  export type NextFunction = () => void;

  export type Request = {
    correlationId?: string;
    header(name: string): string | undefined;
  };

  export type Response = {
    setHeader(name: string, value: string): void;
    status(code: number): Response;
    json(body: unknown): Response;
  };

  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;

  export type Router = {
    get(path: string, handler: (req: Request, res: Response) => void): Router;
  };

  export type Express = {
    disable(name: string): void;
    use(handler: unknown): void;
    listen(port: number, callback?: () => void): void;
  };

  type ExpressFactory = {
    (): Express;
    json(): RequestHandler;
  };

  export function Router(): Router;

  const express: ExpressFactory;
  export default express;
}
