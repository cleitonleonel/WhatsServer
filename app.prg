REQUEST HB_CODEPAGE_PTISO, HB_CODEPAGE_UTF8EX
#require "hbcurl"
#require "hbtip"
#include "inkey.ch"
#include "fileio.ch"

PROCEDURE Main()
   Local cUrlBase := "http://0.0.0.0:3333/api/v1/"
   Local cSession := Space( 15 )
   Local cNumber := Space( 15 )
   Local cText := Space( 50 )
   Local cCaption := Space ( 50 )
   Local cFilePath := Space( 50 )
   Local nChoice := 0
   Local cPayload, cResult, oResult, cJson := {=>}

   hb_cdpSelect( "PTISO" )
   cls
   @ 1,10 SAY "Informe a sessão usada: " GET cSession
   @ 2,10 SAY "Digite o Número do whatsapp: " GET cNumber
   @ 3,10 SAY "Escolha o tipo de mensagem (1 - Texto, 2 - Arquivo, 3 - Upload): " GET nChoice
   read

   IF nChoice == 1
      @ 4,10 SAY "Digite a mensagem: " GET cText
      read
      cUrl := cUrlBase + "sendtext"
      cJson := { "session" => rtrim( cSession ), "number" => rtrim( cNumber ), "text" => rtrim( hb_StrToUTF8( cText ) ) }
      cPayload := hb_jsonEncode( cJson )
      cResult := SendMessage( cUrl, cPayload )
   ELSEIF nChoice == 2
      @ 4,10 SAY "Digite o caminho completo do arquivo a ser enviado: " GET cFilePath
      @ 5,10 SAY "Digite o assunto referente o arquivo a ser enviado: " GET cCaption
      read
      cUrl := cUrlBase + "sendfile"
      cJson := { "session" => rtrim( cSession ), "number" => rtrim( cNumber ), "path" => rtrim( cFilePath ), "caption" => rtrim( hb_StrToUTF8( cCaption ) )}
      cPayload := hb_jsonEncode( cJson )
      cResult := SendMessage( cUrl, cPayload)
   ELSEIF nChoice == 3
      @ 6,10 SAY "Digite o caminho completo do arquivo a ser enviado: " GET cFilePath
      @ 7,10 SAY "Digite o assunto referente o arquivo a ser enviado: " GET cCaption
      read
      cUrl := cUrlBase + "upload"
      cJson := { "session" => rtrim( cSession ), "number" => rtrim( cNumber ), "file" => rtrim( cFilePath ), "caption" => rtrim( hb_StrToUTF8( cCaption ) )}
      cPayload := hb_jsonEncode( cJson )
      cResult := SendMessageUpload( cUrl, cPayload)
   ELSE
      ? "Opção inválida!"
      RETURN
   ENDIF
   IF ! Empty( cResult )
      oResult := hb_jsonDecode( cResult )
      IF ! Empty( oResult )
         ? "Mensagem enviada com sucesso!"
         ? "RESULT: ", oResult["response"]["_data"]["id"]["remote"]["user"]
      ELSE
         ? "Erro ao enviar mensagem: ", oResult["success"]
      ENDIF
   ELSE
      ? "Erro ao acessar API!"
   ENDIF

Return


FUNCTION SendMessage(cLink, cPayload)
   Local curl, cErr, http_code := 0, cResponse
   curl_global_init()
   IF ! Empty( curl := curl_easy_init() )
      curl_easy_reset( curl )
      curl_easy_setopt( curl, HB_CURLOPT_USERAGENT, 'Mozilla/5.0 (MSIE; Windows 10)' )
      curl_easy_setopt( curl, HB_CURLOPT_CONNECTTIMEOUT, 0 )
      curl_easy_setopt( curl, HB_CURLOPT_TIMEOUT, 5 )
      curl_easy_setopt( curl, HB_CURLOPT_HTTPHEADER, {"Content-Type: application/json"} )
      curl_easy_setopt( curl, HB_CURLOPT_POST, .T. )
      curl_easy_setopt( curl, HB_CURLOPT_POSTFIELDS, cPayload )
      curl_easy_setopt( curl, HB_CURLOPT_URL, cLink)
      curl_easy_setopt( curl, HB_CURLOPT_VERBOSE, .F. )
      curl_easy_setopt( curl, HB_CURLOPT_DL_BUFF_SETUP )
      curl_easy_perform( curl )
      http_code := curl_easy_getinfo( curl, HB_CURLINFO_RESPONSE_CODE )
      IF http_code == 200
         cResponse := curl_easy_dl_buff_get( curl )
         RETURN cResponse
      ELSE
         alert( "Erro na chamada da API: HTTP ", http_code )
      ENDIF
   ENDIF
   curl_global_cleanup()

Return ""


Function SendMessageUpload(cLink, cPayload)
    Local curl, cErr, http_code := 0, cResponse, aHeaders, curlErr, boundary
    cFormBody = BoundaryMake(cPayload, boundary := '----' + hb_StrToHex ( hb_TtoC( hb_DateTime(), 'YYYYMMDDhhmmssfff' ) ) )
    curl_global_init()
    IF ! Empty( curl := curl_easy_init() )
        curl_easy_reset( curl )
        aHeaders := {"Content-Length: " + Str(Len(cFormBody)), "Content-Type: " + "multipart/form-data; boundary=" + boundary}
        curl_easy_setopt( curl, HB_CURLOPT_USERAGENT, 'Mozilla/5.0 (MSIE; Windows 10)' )
        curl_easy_setopt( curl, HB_CURLOPT_HTTPHEADER, aHeaders)
        curl_easy_setopt( curl, HB_CURLOPT_FOLLOWLOCATION, .T. )
        curl_easy_setopt( curl, HB_CURLOPT_SSL_VERIFYPEER, .F. )
        curl_easy_setopt( curl, HB_CURLOPT_DL_BUFF_SETUP )
        curl_easy_setopt( curl, HB_CURLOPT_POST, .T. )
        curl_easy_setopt( curl, HB_CURLOPT_URL, cLink )
        curl_easy_setopt( curl, HB_CURLOPT_POSTFIELDSIZE, LEN( cFormBody ) )
        curl_easy_setopt( curl, HB_CURLOPT_POSTFIELDS, cFormBody )
        curlErr := curl_easy_perform( curl )
        IF !EMPTY( curlErr )
            cReturn := "!ERROR!" + curl_easy_strerror(curlErr)
        ELSE
            cReturn := curl_easy_dl_buff_get( curl )
        ENDIF
   ENDIF
   curl_global_cleanup()

Return cReturn


Function BoundaryMake(cPayload, boundary)
    Local cContentType := ""
    Local CRLF := chr(13) + chr(10)
    Local cData := hb_jsonDecode( cPayload )
    Local cPlikFile := hb_FNameNameExt ( cData["file"] )
    Local cFormBody := '--' + boundary + CRLF
    cFormBody+='Content-Disposition: form-data; name="session"'+ CRLF
    cFormBody+='Content-Type: text/plain' + CRLF + CRLF
    cFormBody+=Alltrim ( cData["session"] ) + CRLF
    cFormBody+='--' + boundary + CRLF
    cFormBody+='Content-Disposition: form-data; name="caption"' + CRLF
    cFormBody+='Content-Type: text/plain' + CRLF + CRLF
    cFormBody+=Alltrim ( cData["caption"] ) + CRLF
    cFormBody+='--' + boundary + CRLF
    cFormBody+='Content-Disposition: form-data; name="number"' + CRLF
    cFormBody+='Content-Type: text/plain' + CRLF + CRLF
    cFormBody+=Alltrim ( cData["number"] ) + CRLF
    cFormBody+='--' + boundary + CRLF
    cFormBody+='Content-Disposition: form-data; name="file"; filename="' + cPlikFile + '"' + CRLF
    cContentType := tip_FileMimeType( cData["file"] )
    cFormBody+='Content-Type: ' + cContentType + CRLF + CRLF
    cFormBody+=FILESTR( cData["file"] ) + CRLF
    cFormBody+='--' + boundary + '--' + CRLF

Return cFormBody
