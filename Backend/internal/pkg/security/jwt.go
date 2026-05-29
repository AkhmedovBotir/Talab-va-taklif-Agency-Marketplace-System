package security

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	AdminID uint   `json:"admin_id"`
	Role    string `json:"role"`
	jwt.RegisteredClaims
}

type ContragentClaims struct {
	ContragentID uint `json:"contragent_id"`
	jwt.RegisteredClaims
}

type MarketplaceClaims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

type PunktClaims struct {
	PunktID uint `json:"punkt_id"`
	jwt.RegisteredClaims
}

type AgentClaims struct {
	AgentID uint `json:"agent_id"`
	jwt.RegisteredClaims
}

type LocalShopClaims struct {
	LocalShopID uint `json:"local_shop_id"`
	jwt.RegisteredClaims
}

type DeliveryProviderClaims struct {
	DeliveryProviderID uint `json:"delivery_provider_id"`
	jwt.RegisteredClaims
}

type ManagerClaims struct {
	ManagerID uint `json:"manager_id"`
	jwt.RegisteredClaims
}

// IntegrationClaims — integratsiya API kaliti orqali login qilingan JWT.
type IntegrationClaims struct {
	IntegrationKeyID uint   `json:"integration_key_id"`
	TokenUse         string `json:"token_use"` // "integration"
	jwt.RegisteredClaims
}

func GenerateToken(secret string, adminID uint, role string, expireHours int) (string, error) {
	claims := Claims{
		AdminID: adminID,
		Role:    role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseToken(secret, tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	return claims, nil
}

func GenerateContragentToken(secret string, contragentID uint, expireHours int) (string, error) {
	claims := ContragentClaims{
		ContragentID: contragentID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseContragentToken(secret, tokenString string) (*ContragentClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &ContragentClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*ContragentClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	return claims, nil
}

func GenerateMarketplaceToken(secret string, userID uint, expireHours int) (string, error) {
	claims := MarketplaceClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseMarketplaceToken(secret, tokenString string) (*MarketplaceClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &MarketplaceClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*MarketplaceClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	return claims, nil
}

func GeneratePunktToken(secret string, punktID uint, expireHours int) (string, error) {
	claims := PunktClaims{
		PunktID: punktID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParsePunktToken(secret, tokenString string) (*PunktClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &PunktClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*PunktClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	return claims, nil
}

func GenerateAgentToken(secret string, agentID uint, expireHours int) (string, error) {
	claims := AgentClaims{
		AgentID: agentID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseAgentToken(secret, tokenString string) (*AgentClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AgentClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*AgentClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	return claims, nil
}

func GenerateLocalShopToken(secret string, localShopID uint, expireHours int) (string, error) {
	claims := LocalShopClaims{
		LocalShopID: localShopID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseLocalShopToken(secret, tokenString string) (*LocalShopClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &LocalShopClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*LocalShopClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	return claims, nil
}

func GenerateDeliveryProviderToken(secret string, deliveryProviderID uint, expireHours int) (string, error) {
	claims := DeliveryProviderClaims{
		DeliveryProviderID: deliveryProviderID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseDeliveryProviderToken(secret, tokenString string) (*DeliveryProviderClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &DeliveryProviderClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*DeliveryProviderClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	return claims, nil
}

func GenerateManagerToken(secret string, managerID uint, expireHours int) (string, error) {
	claims := ManagerClaims{
		ManagerID: managerID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseManagerToken(secret, tokenString string) (*ManagerClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &ManagerClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*ManagerClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	return claims, nil
}

const IntegrationTokenUse = "integration"

func GenerateIntegrationToken(secret string, integrationKeyID uint, expireHours int) (string, error) {
	claims := IntegrationClaims{
		IntegrationKeyID: integrationKeyID,
		TokenUse:         IntegrationTokenUse,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseIntegrationToken(secret, tokenString string) (*IntegrationClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &IntegrationClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("imzo usuli xato")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*IntegrationClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token yaroqsiz")
	}
	if claims.TokenUse != IntegrationTokenUse {
		return nil, errors.New("token turi mos emas")
	}
	return claims, nil
}
