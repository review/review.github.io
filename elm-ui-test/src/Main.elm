port module Main exposing (main)

import Browser
import Element exposing (rgb255, text)
import Element.Background as Background
import Element.Font as Font
import Element.Input as Input
import Html exposing (Html)
import Json.Encode as Encode
import Round
import Time



-- Main


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



-- Messages


type Msg
    = TogglePlayback
    | Restart
    | ChangeTime Time



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    case model.playback of
        Playing ->
            Time.every 100 (\_ -> ChangeTime (model.time + 0.1))

        Paused ->
            Sub.none



-- Ports


port portIsPaused : Encode.Value -> Cmd msg



-- Model


type ReviewStatus
    = Splash
    | Loading
    | Ready


type Playback
    = Paused
    | Playing


type alias Time =
    Float


type alias SpeedFactor =
    Int


type alias Model =
    { status : ReviewStatus
    , playback : Playback
    , time : Time
    , timeEnd : Time
    , speed : SpeedFactor
    }



-- Init


init : flags -> ( Model, Cmd Msg )
init flags =
    ( { status = Splash
      , playback = Paused
      , time = 0
      , timeEnd = 10
      , speed = 1
      }
    , portIsPaused <| Encode.bool False
    )



-- View


uiElementColor : Element.Color
uiElementColor =
    Element.rgb255 250 250 250



-- button : String -> Input.button


button : String -> Msg -> Element.Element Msg
button label msg =
    Input.button
        [ Background.color uiElementColor
        , Element.width (Element.px 80)
        , Element.height (Element.px 80)
        , Font.center
        ]
        { onPress = Just msg
        , label = Element.text label
        }


view : Model -> Html Msg
view model =
    Element.layout [ Element.height Element.shrink ] <|
        Element.row [ Element.width (Element.px 600) ]
            [ button (playbackButtonText model.playback) TogglePlayback
            , button "Restart" Restart
            , Input.slider
                [ Element.height (Element.px 80)

                -- Here is where we're creating/styling the "track"
                , Element.behindContent
                    (Element.el
                        [ Element.width Element.fill
                        , Element.height (Element.px 2)
                        , Element.centerY
                        , Background.color uiElementColor

                        --, Border.rounded 2
                        ]
                        Element.none
                    )
                ]
                { label =
                    Input.labelLeft
                        [ Element.width (Element.px 80)
                        , Font.alignRight
                        , Element.centerY
                        ]
                        (Element.text <| Round.round 2 model.time)
                , max = model.timeEnd
                , min = 0
                , onChange = \new -> ChangeTime new -- { model | spiciness = new }
                , step = Nothing -- Maybe Float
                , thumb = Input.defaultThumb
                , value = model.time
                }
            , Element.text (Round.round 2 model.timeEnd)
            ]


playbackButtonText : Playback -> String
playbackButtonText playback =
    case playback of
        Paused ->
            "Play"

        Playing ->
            "Pause"



-- Update


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        playStatus =
            togglePlayback model.playback
    in
    case msg of
        TogglePlayback ->
            ( { model | playback = playStatus }, portIsPaused <| Encode.bool (playStatus == Paused) )

        Restart ->
            ( { model | time = 0 }, Cmd.none )

        ChangeTime time ->
            ( { model | time = time }, Cmd.none )


togglePlayback : Playback -> Playback
togglePlayback playback =
    case playback of
        Paused ->
            Playing

        Playing ->
            Paused
