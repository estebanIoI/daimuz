import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthDebugger() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [showDebugger, setShowDebugger] = useState(false);

  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return { error: "Token inválido" };
    }
  };

  const checkToken = () => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    const userEmail = localStorage.getItem("userEmail");
    const userId = localStorage.getItem("userId");
    
    let decodedToken = null;
    if (token) {
      decodedToken = decodeJWT(token);
    }
    
    setTokenInfo({
      token: token ? `${token.substring(0, 15)}...` : "No encontrado",
      decoded: decodedToken,
      stored: {
        userRole,
        userEmail,
        userId
      },
      isValid: !!token && !!decodedToken && !decodedToken.error
    });
  };

  return (
    <>
      <div className="text-center mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowDebugger(!showDebugger);
            if (!showDebugger) checkToken();
          }}
        >
          {showDebugger ? "Ocultar información de depuración" : "Mostrar información de depuración"}
        </Button>
      </div>

      {showDebugger && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Información de autenticación</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Estado del token:</span>{" "}
                {tokenInfo?.isValid ? (
                  <span className="text-green-600">Válido</span>
                ) : (
                  <span className="text-red-600">Inválido o no encontrado</span>
                )}
              </div>

              {tokenInfo?.decoded && (
                <div>
                  <span className="font-medium">Token decodificado:</span>
                  <pre className="bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-32">
                    {JSON.stringify(tokenInfo.decoded, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="font-medium">Información guardada:</span>
                <pre className="bg-gray-100 p-2 mt-1 rounded overflow-auto">
                  {JSON.stringify(tokenInfo?.stored, null, 2)}
                </pre>
              </div>

              <Button size="sm" onClick={checkToken}>
                Actualizar información
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
