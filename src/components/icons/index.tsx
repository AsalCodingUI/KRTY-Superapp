"use client"

/**
 * The app's icons: our own set (./set, ./custom.tsx), redrawn on a 24px
 * grid with a 1.5 stroke from the Untitled UI line set as the base. Import
 * every icon from here, never from "@untitledui/icons" or ./set directly,
 * so the set stays one decision. Names keep the app's existing
 * (lucide-style) names; the right-hand side is our glyph (K.* is named
 * after the Untitled glyph it replaces; C.* is drawn in ./custom.tsx).
 * Stroke: STROKE, for all. See docs/ui/icons.md and /icon-lab.
 */

import * as React from "react"
import { STROKE } from "./custom"
import * as C from "./custom"
import * as K from "./set"

/** Untitled UI's free set is line only: kept so `weight` props still type. */
export type IconWeight = "Outline" | "Filled"

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string
  color?: string
  /** No filled set in the free icons: ignored. */
  weight?: IconWeight
  /** Ignored: the stroke is one setting (STROKE in ./custom.tsx). */
  strokeWidth?: number | string
  /** Ignored (old lucide prop). */
  absoluteStrokeWidth?: boolean
}

export type Icon = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>
/** Old names, kept so existing type imports keep working. */
export type LucideIcon = Icon
export type LucideProps = IconProps

type Source = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number; color?: string }
>

/** Decorative unless labelled; 24px unless a size-* class (the usual way)
 *  sets it; the app's stroke. */
function icon(Glyph: Source, name: string): Icon {
  const C = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
    { weight: _w, strokeWidth: _s, absoluteStrokeWidth: _a, size, ...props },
    _ref,
  ) {
    const labelled = props["aria-label"] || props["aria-labelledby"]
    return (
      <Glyph
        aria-hidden={labelled ? undefined : true}
        {...props}
        {...(typeof size === "string"
          ? { width: size, height: size }
          : { size: size ?? 24 })}
        strokeWidth={STROKE}
      />
    )
  })
  C.displayName = name
  // Drawn by us (custom.tsx), not taken from Untitled UI: /icon-lab marks it.
  ;(C as { ours?: boolean }).ours = Boolean((Glyph as { ours?: boolean }).ours)
  return C
}

/** Kept for the old `Ri*Fill` names: the free set has no filled icons, so
 *  it's the same icon. */
export function filled(Source: Icon, _name: string): Icon {
  return Source
}

export const AlignCenter = /*#__PURE__*/ icon(K.AlignCenter, "AlignCenter")
export const AlignLeft = /*#__PURE__*/ icon(K.AlignLeft02, "AlignLeft")
export const AlignRight = /*#__PURE__*/ icon(K.AlignRight02, "AlignRight")
export const AppWindow = /*#__PURE__*/ icon(K.Browser, "AppWindow")
export const Archive = /*#__PURE__*/ icon(K.Archive, "Archive")
export const ArchiveRestore = /*#__PURE__*/ icon(K.Archive, "ArchiveRestore")
export const ArrowDown = /*#__PURE__*/ icon(K.ArrowDown, "ArrowDown")
export const ArrowLeft = /*#__PURE__*/ icon(C.ArrowLeft, "ArrowLeft")
export const ArrowLeftRight = /*#__PURE__*/ icon(
  K.SwitchHorizontal01,
  "ArrowLeftRight",
)
export const ArrowRight = /*#__PURE__*/ icon(K.ArrowRight, "ArrowRight")
export const ArrowUp = /*#__PURE__*/ icon(K.ArrowUp, "ArrowUp")
export const ArrowUpRight = /*#__PURE__*/ icon(K.ArrowUpRight, "ArrowUpRight")
export const ArrowUpToLine = /*#__PURE__*/ icon(
  K.AlignTopArrow02,
  "ArrowUpToLine",
)
export const AtSign = /*#__PURE__*/ icon(K.AtSign, "AtSign")
export const BadgeCheck = /*#__PURE__*/ icon(K.CheckVerified01, "BadgeCheck")
export const Ban = /*#__PURE__*/ icon(K.SlashCircle01, "Ban")
export const BarChart3 = /*#__PURE__*/ icon(K.BarChart01, "BarChart3")
export const Bell = /*#__PURE__*/ icon(K.Bell02, "Bell")
export const Bold = /*#__PURE__*/ icon(K.Bold01, "Bold")
export const BookClosed = /*#__PURE__*/ icon(K.BookClosed, "BookClosed")
export const BookOpen = /*#__PURE__*/ icon(K.BookOpen02, "BookOpen")
export const Briefcase = /*#__PURE__*/ icon(K.Briefcase02, "Briefcase")
export const BriefcaseBusiness = /*#__PURE__*/ icon(
  K.Briefcase02,
  "BriefcaseBusiness",
)
export const Building2 = /*#__PURE__*/ icon(K.Building01, "Building2")
export const Calculator = /*#__PURE__*/ icon(K.Calculator, "Calculator")
export const CalendarCheck = /*#__PURE__*/ icon(
  K.CalendarCheck02,
  "CalendarCheck",
)
export const CalendarClock = /*#__PURE__*/ icon(K.CalendarDate, "CalendarClock")
export const CalendarDays = /*#__PURE__*/ icon(C.CalendarDays, "CalendarDays")
export const CalendarOff = /*#__PURE__*/ icon(K.CalendarMinus02, "CalendarOff")
export const CalendarPlus = /*#__PURE__*/ icon(K.CalendarPlus02, "CalendarPlus")
export const CalendarRange = /*#__PURE__*/ icon(K.CalendarDate, "CalendarRange")
export const CalendarSearch = /*#__PURE__*/ icon(K.Calendar, "CalendarSearch")
export const CalendarX = /*#__PURE__*/ icon(K.CalendarMinus02, "CalendarX")
export const Camera = /*#__PURE__*/ icon(K.Camera02, "Camera")
export const ChartColumnIncreasing = /*#__PURE__*/ icon(
  K.BarChart01,
  "ChartColumnIncreasing",
)
export const ChartLine = /*#__PURE__*/ icon(K.LineChartUp04, "ChartLine")
export const Check = /*#__PURE__*/ icon(C.Check, "Check")
export const CheckCheck = /*#__PURE__*/ icon(K.CheckDone01, "CheckCheck")
export const CheckCircle2 = /*#__PURE__*/ icon(K.CheckSquare, "CheckCircle2")
export const ChevronDown = /*#__PURE__*/ icon(C.ChevronDown, "ChevronDown")
export const ChevronDownSquare = /*#__PURE__*/ icon(
  K.ChevronDown,
  "ChevronDownSquare",
)
export const ChevronLeft = /*#__PURE__*/ icon(K.ChevronLeft, "ChevronLeft")
export const ChevronRight = /*#__PURE__*/ icon(C.ChevronRight, "ChevronRight")
export const ChevronUp = /*#__PURE__*/ icon(K.ChevronUp, "ChevronUp")
export const ChevronsDownUp = /*#__PURE__*/ icon(
  K.ChevronSelectorVertical,
  "ChevronsDownUp",
)
export const ChevronsLeft = /*#__PURE__*/ icon(
  K.ChevronLeftDouble,
  "ChevronsLeft",
)
export const ChevronsLeftIcon = /*#__PURE__*/ icon(
  K.ChevronLeftDouble,
  "ChevronsLeftIcon",
)
export const ChevronsRight = /*#__PURE__*/ icon(
  K.ChevronRightDouble,
  "ChevronsRight",
)
export const ChevronsRightIcon = /*#__PURE__*/ icon(
  K.ChevronRightDouble,
  "ChevronsRightIcon",
)
export const ChevronsUp = /*#__PURE__*/ icon(K.ChevronUpDouble, "ChevronsUp")
export const ChevronsUpDown = /*#__PURE__*/ icon(
  K.ChevronSelectorVertical,
  "ChevronsUpDown",
)
export const Chrome = /*#__PURE__*/ icon(K.GoogleChrome, "Chrome")
export const Circle = /*#__PURE__*/ icon(K.Circle, "Circle")
export const CircleAlert = /*#__PURE__*/ icon(K.AlertSquare, "CircleAlert")
export const CircleCheck = /*#__PURE__*/ icon(K.CheckSquare, "CircleCheck")
export const CircleCheckIcon = /*#__PURE__*/ icon(
  K.CheckSquare,
  "CircleCheckIcon",
)
export const CircleDashed = /*#__PURE__*/ icon(C.CircleDashed, "CircleDashed")
export const CircleDollarSign = /*#__PURE__*/ icon(
  K.CurrencyDollarCircle,
  "CircleDollarSign",
)
export const CircleDot = /*#__PURE__*/ icon(C.CircleDot, "CircleDot")
export const CircleCheckSolid = /*#__PURE__*/ icon(
  C.CircleCheckSolid,
  "CircleCheckSolid",
)
export const CircleHelp = /*#__PURE__*/ icon(K.HelpSquare, "CircleHelp")
export const CircleX = /*#__PURE__*/ icon(K.XSquare, "CircleX")
export const ClipboardCheck = /*#__PURE__*/ icon(
  K.ClipboardCheck,
  "ClipboardCheck",
)
export const ClipboardCopy = /*#__PURE__*/ icon(C.Copy, "ClipboardCopy")
export const ClipboardPaste = /*#__PURE__*/ icon(K.Clipboard, "ClipboardPaste")
export const Clock = /*#__PURE__*/ icon(C.Clock, "Clock")
export const Cloud = /*#__PURE__*/ icon(K.Cloud01, "Cloud")
export const CloudOff = /*#__PURE__*/ icon(K.CloudOff, "CloudOff")
export const CloudUpload = /*#__PURE__*/ icon(K.UploadCloud02, "CloudUpload")
export const Code = /*#__PURE__*/ icon(K.Code02, "Code")
export const Code2 = /*#__PURE__*/ icon(K.Code02, "Code2")
/** Drawn here (./custom.tsx): not in Untitled UI. */
export const Coffee = /*#__PURE__*/ icon(C.Coffee, "Coffee")
export const Columns2 = /*#__PURE__*/ icon(K.Columns02, "Columns2")
export const Columns3 = /*#__PURE__*/ icon(K.Columns03, "Columns3")
export const Copy = /*#__PURE__*/ icon(C.Copy, "Copy")
export const CopyPlus = /*#__PURE__*/ icon(K.Copy04, "CopyPlus")
export const CornerDownLeft = /*#__PURE__*/ icon(
  K.CornerDownLeft,
  "CornerDownLeft",
)
export const CornerDownRight = /*#__PURE__*/ icon(
  K.CornerDownRight,
  "CornerDownRight",
)
export const CornerLeftUp = /*#__PURE__*/ icon(K.CornerLeftUp, "CornerLeftUp")
export const CreditCard = /*#__PURE__*/ icon(K.CreditCard01, "CreditCard")
export const Delete = /*#__PURE__*/ icon(K.Trash03, "Delete")
export const Download = /*#__PURE__*/ icon(K.Download01, "Download")
export const EllipsisIcon = /*#__PURE__*/ icon(K.DotsHorizontal, "EllipsisIcon")
export const Eraser = /*#__PURE__*/ icon(K.Eraser, "Eraser")
export const ExternalLink = /*#__PURE__*/ icon(K.LinkExternal02, "ExternalLink")
export const Eye = /*#__PURE__*/ icon(K.Eye, "Eye")
export const EyeOff = /*#__PURE__*/ icon(K.EyeOff, "EyeOff")
export const File = /*#__PURE__*/ icon(K.File01, "File")
export const FileIcon = /*#__PURE__*/ icon(K.File01, "FileIcon")
export const FileImage = /*#__PURE__*/ icon(K.Image01, "FileImage")
export const FilePen = /*#__PURE__*/ icon(K.Edit04, "FilePen")
export const FilePlus = /*#__PURE__*/ icon(K.FilePlus01, "FilePlus")
export const FilePlus2 = /*#__PURE__*/ icon(K.FilePlus01, "FilePlus2")
export const FileSignature = /*#__PURE__*/ icon(K.File06, "FileSignature")
export const FileChart = /*#__PURE__*/ icon(K.File03, "FileChart")
export const FileText = /*#__PURE__*/ icon(C.FileText, "FileText")
export const Files = /*#__PURE__*/ icon(C.Copy, "Files")
export const Filter = /*#__PURE__*/ icon(K.FilterLines, "Filter")
export const Flag = /*#__PURE__*/ icon(K.Flag01, "Flag")
export const Flower = /*#__PURE__*/ icon(K.Sun, "Flower")
export const Folder = /*#__PURE__*/ icon(C.Folder, "Folder")
export const FolderInput = /*#__PURE__*/ icon(K.FolderDownload, "FolderInput")
export const FolderKanban = /*#__PURE__*/ icon(K.LayoutAlt04, "FolderKanban")
export const FolderOpen = /*#__PURE__*/ icon(K.Folder, "FolderOpen")
export const FolderPlus = /*#__PURE__*/ icon(K.FolderPlus, "FolderPlus")
export const GalleryHorizontal = /*#__PURE__*/ icon(
  K.Image01,
  "GalleryHorizontal",
)
export const Gauge = /*#__PURE__*/ icon(K.Speedometer03, "Gauge")
export const Globe = /*#__PURE__*/ icon(K.Globe01, "Globe")
export const GripHorizontal = /*#__PURE__*/ icon(
  C.GripHorizontal,
  "GripHorizontal",
)
export const GripVertical = /*#__PURE__*/ icon(C.GripVertical, "GripVertical")
export const Hammer = /*#__PURE__*/ icon(K.Tool01, "Hammer")
export const Hash = /*#__PURE__*/ icon(K.Hash02, "Hash")
export const Heading = /*#__PURE__*/ icon(K.Heading01, "Heading")
export const Heading1 = /*#__PURE__*/ icon(K.Heading01, "Heading1")
export const Heading2 = /*#__PURE__*/ icon(K.Heading02, "Heading2")
export const Heading3 = /*#__PURE__*/ icon(K.HeadingSquare, "Heading3")
export const Heart = /*#__PURE__*/ icon(K.Heart, "Heart")
export const Home = /*#__PURE__*/ icon(C.Home, "Home")
export const HouseWindow = /*#__PURE__*/ icon(C.HouseWindow, "HouseWindow")
export const HouseWindowSolid = /*#__PURE__*/ icon(C.HouseWindowSolid, "HouseWindowSolid")
export const BriefcaseSolid = /*#__PURE__*/ icon(C.BriefcaseSolid, "BriefcaseSolid")
export const InboxSolid = /*#__PURE__*/ icon(C.InboxSolid, "InboxSolid")
export const BookClosedSolid = /*#__PURE__*/ icon(C.BookClosedSolid, "BookClosedSolid")
export const LockSolid = /*#__PURE__*/ icon(C.LockSolid, "LockSolid")
export const IdCard = /*#__PURE__*/ icon(K.CreditCard01, "IdCard")
export const Image = /*#__PURE__*/ icon(K.Image01, "Image")
export const ImageIcon = /*#__PURE__*/ icon(K.Image01, "ImageIcon")
export const ImagePlus = /*#__PURE__*/ icon(K.ImagePlus, "ImagePlus")
export const ImageUp = /*#__PURE__*/ icon(K.ImageUp, "ImageUp")
export const Inbox = /*#__PURE__*/ icon(K.Inbox01, "Inbox")
export const Infinity = /*#__PURE__*/ icon(K.Infinity, "Infinity")
export const Info = /*#__PURE__*/ icon(K.InfoSquare, "Info")
export const InfoIcon = /*#__PURE__*/ icon(K.InfoSquare, "InfoIcon")
export const Italic = /*#__PURE__*/ icon(K.Italic01, "Italic")
export const Languages = /*#__PURE__*/ icon(K.Translate01, "Languages")
export const Layers = /*#__PURE__*/ icon(K.LayersTwo01, "Layers")
export const LayoutDashboard = /*#__PURE__*/ icon(
  K.LayoutAlt01,
  "LayoutDashboard",
)
export const LayoutGrid = /*#__PURE__*/ icon(K.LayoutGrid01, "LayoutGrid")
export const Link = /*#__PURE__*/ icon(K.Link02, "Link")
export const Link2 = /*#__PURE__*/ icon(K.Link02, "Link2")
export const Link2Off = /*#__PURE__*/ icon(K.LinkBroken02, "Link2Off")
export const List = /*#__PURE__*/ icon(K.List, "List")
export const ListChecks = /*#__PURE__*/ icon(K.CheckDone01, "ListChecks")
export const ListCollapse = /*#__PURE__*/ icon(
  K.AlignTopArrow02,
  "ListCollapse",
)
export const ListFilter = /*#__PURE__*/ icon(K.FilterLines, "ListFilter")
export const ListIcon = /*#__PURE__*/ icon(K.List, "ListIcon")
export const ListOrdered = /*#__PURE__*/ icon(C.ListOrdered, "ListOrdered")
export const ListPlus = /*#__PURE__*/ icon(K.Plus, "ListPlus")
export const ListTodo = /*#__PURE__*/ icon(K.CheckSquare, "ListTodo")
export const Loader = /*#__PURE__*/ icon(K.Loading02, "Loader")
export const Loader2Icon = /*#__PURE__*/ icon(K.Loading02, "Loader2Icon")
export const LoaderCircle = /*#__PURE__*/ icon(K.Loading02, "LoaderCircle")
export const Lock = /*#__PURE__*/ icon(K.Lock03, "Lock")
export const LogIn = /*#__PURE__*/ icon(K.LogIn01, "LogIn")
export const LogOut = /*#__PURE__*/ icon(K.LogOut01, "LogOut")
export const Logout = /*#__PURE__*/ icon(K.LogOut01, "Logout")
export const Mail = /*#__PURE__*/ icon(K.Mail01, "Mail")
export const MailOpen = /*#__PURE__*/ icon(K.Mail01, "MailOpen")
export const MapPin = /*#__PURE__*/ icon(K.MarkerPin01, "MapPin")
export const Maximize = /*#__PURE__*/ icon(K.Maximize01, "Maximize")
export const Maximize2 = /*#__PURE__*/ icon(K.Expand01, "Maximize2")
export const Megaphone = /*#__PURE__*/ icon(K.Announcement02, "Megaphone")
export const Menu = /*#__PURE__*/ icon(K.Menu01, "Menu")
export const MessageCircle = /*#__PURE__*/ icon(
  K.MessageSquare02,
  "MessageCircle",
)
export const MessageSquareWarning = /*#__PURE__*/ icon(
  K.MessageAlertSquare,
  "MessageSquareWarning",
)
export const Minimize2 = /*#__PURE__*/ icon(K.Minimize01, "Minimize2")
export const Minus = /*#__PURE__*/ icon(K.Minus, "Minus")
export const MinusIcon = /*#__PURE__*/ icon(K.Minus, "MinusIcon")
export const Monitor = /*#__PURE__*/ icon(K.Monitor02, "Monitor")
export const Moon = /*#__PURE__*/ icon(K.Moon02, "Moon")
export const MoreHorizontal = /*#__PURE__*/ icon(
  C.MoreHorizontal,
  "MoreHorizontal",
)
export const MoreHorizontalIcon = /*#__PURE__*/ icon(
  K.DotsHorizontal,
  "MoreHorizontalIcon",
)
export const MoreVertical = /*#__PURE__*/ icon(K.DotsVertical, "MoreVertical")
export const MousePointerClick = /*#__PURE__*/ icon(
  K.CursorClick01,
  "MousePointerClick",
)
export const Newspaper = /*#__PURE__*/ icon(K.File06, "Newspaper")
export const NotebookPen = /*#__PURE__*/ icon(K.Edit04, "NotebookPen")
export const OctagonAlert = /*#__PURE__*/ icon(K.AlertOctagon, "OctagonAlert")
export const OctagonXIcon = /*#__PURE__*/ icon(K.SlashOctagon, "OctagonXIcon")
export const Palette = /*#__PURE__*/ icon(K.Palette, "Palette")
export const PanelLeftIcon = /*#__PURE__*/ icon(K.LayoutLeft, "PanelLeftIcon")
export const Paperclip = /*#__PURE__*/ icon(K.Paperclip, "Paperclip")
export const Pause = /*#__PURE__*/ icon(K.PauseSquare, "Pause")
export const Pencil = /*#__PURE__*/ icon(C.Pencil, "Pencil")
export const PencilRuler = /*#__PURE__*/ icon(K.PenTool01, "PencilRuler")
export const Phone = /*#__PURE__*/ icon(K.Phone, "Phone")
export const PieChart = /*#__PURE__*/ icon(K.PieChart01, "PieChart")
export const Pilcrow = /*#__PURE__*/ icon(K.Pilcrow01, "Pilcrow")
export const Pin = /*#__PURE__*/ icon(K.Pin02, "Pin")
export const Play = /*#__PURE__*/ icon(K.Play, "Play")
export const Plus = /*#__PURE__*/ icon(C.Plus, "Plus")
export const Power = /*#__PURE__*/ icon(K.Power01, "Power")
export const Printer = /*#__PURE__*/ icon(K.Printer, "Printer")
export const Quote = /*#__PURE__*/ icon(K.MessageTextSquare02, "Quote")
export const Radio = /*#__PURE__*/ icon(K.Podcast, "Radio")
export const Redo2 = /*#__PURE__*/ icon(K.FlipForward, "Redo2")
export const RefreshCW = /*#__PURE__*/ icon(K.RefreshCw03, "RefreshCW")
export const Repeat2 = /*#__PURE__*/ icon(K.Repeat02, "Repeat2")
export const Rocket = /*#__PURE__*/ icon(K.Rocket01, "Rocket")
export const RotateCcw = /*#__PURE__*/ icon(K.RefreshCcw03, "RotateCcw")
export const RotateCw = /*#__PURE__*/ icon(K.RefreshCw03, "RotateCw")
export const Rows2 = /*#__PURE__*/ icon(K.Rows02, "Rows2")
export const Ruler = /*#__PURE__*/ icon(K.Ruler, "Ruler")
export const Save = /*#__PURE__*/ icon(K.Save01, "Save")
export const Scissors = /*#__PURE__*/ icon(K.Scissors01, "Scissors")
export const ScrollText = /*#__PURE__*/ icon(K.File05, "ScrollText")
export const Search = /*#__PURE__*/ icon(C.Search, "Search")
export const SearchCheck = /*#__PURE__*/ icon(K.SearchRefraction, "SearchCheck")
export const Send = /*#__PURE__*/ icon(K.Send01, "Send")
export const SeparatorHorizontal = /*#__PURE__*/ icon(
  K.Divider,
  "SeparatorHorizontal",
)
export const Settings = /*#__PURE__*/ icon(K.Settings02, "Settings")
export const Settings2 = /*#__PURE__*/ icon(K.Settings02, "Settings2")
export const ShieldCheck = /*#__PURE__*/ icon(K.ShieldTick, "ShieldCheck")
export const SlidersHorizontal = /*#__PURE__*/ icon(
  K.Sliders01,
  "SlidersHorizontal",
)
export const Smartphone = /*#__PURE__*/ icon(K.Phone01, "Smartphone")
export const Smile = /*#__PURE__*/ icon(K.FaceSmile, "Smile")
export const Sparkles = /*#__PURE__*/ icon(K.Stars01, "Sparkles")
export const Split = /*#__PURE__*/ icon(K.GitBranch01, "Split")
export const Square = /*#__PURE__*/ icon(K.Square, "Square")
export const SquarePen = /*#__PURE__*/ icon(K.Edit04, "SquarePen")
export const SquareStop = /*#__PURE__*/ icon(K.StopSquare, "SquareStop")
export const Star = /*#__PURE__*/ icon(K.Star01, "Star")
export const StickyNote = /*#__PURE__*/ icon(K.File03, "StickyNote")
export const StopCircle = /*#__PURE__*/ icon(K.StopSquare, "StopCircle")
export const Strikethrough = /*#__PURE__*/ icon(
  K.Strikethrough01,
  "Strikethrough",
)
export const Sun = /*#__PURE__*/ icon(K.Sun, "Sun")
export const Sunrise = /*#__PURE__*/ icon(K.Sunrise, "Sunrise")
export const Table = /*#__PURE__*/ icon(K.Table, "Table")
export const Table2 = /*#__PURE__*/ icon(K.Table, "Table2")
export const Tablet = /*#__PURE__*/ icon(K.Tablet01, "Tablet")
export const Tag = /*#__PURE__*/ icon(K.Tag01, "Tag")
export const Target = /*#__PURE__*/ icon(K.Target05, "Target")
export const TextCursorInput = /*#__PURE__*/ icon(
  K.TextInput,
  "TextCursorInput",
)
export const TextQuote = /*#__PURE__*/ icon(K.MessageTextSquare02, "TextQuote")
export const TimerReset = /*#__PURE__*/ icon(K.ClockRefresh, "TimerReset")
export const ToggleRight = /*#__PURE__*/ icon(K.Toggle01Right, "ToggleRight")
export const Trash2 = /*#__PURE__*/ icon(K.Trash03, "Trash2")
export const TriangleAlert = /*#__PURE__*/ icon(
  K.AlertTriangle,
  "TriangleAlert",
)
export const TriangleAlertIcon = /*#__PURE__*/ icon(
  K.AlertTriangle,
  "TriangleAlertIcon",
)
export const Underline = /*#__PURE__*/ icon(K.Underline01, "Underline")
export const Undo2 = /*#__PURE__*/ icon(K.FlipBackward, "Undo2")
export const Upload = /*#__PURE__*/ icon(K.Upload01, "Upload")
export const User = /*#__PURE__*/ icon(K.User01, "User")
export const UserCheck = /*#__PURE__*/ icon(K.UserCheck01, "UserCheck")
export const UserPlus = /*#__PURE__*/ icon(K.UserPlus01, "UserPlus")
export const UserRound = /*#__PURE__*/ icon(K.UserSquare, "UserRound")
export const UserRoundX = /*#__PURE__*/ icon(K.UserX01, "UserRoundX")
export const Users = /*#__PURE__*/ icon(K.Users02, "Users")
export const UsersRound = /*#__PURE__*/ icon(K.Users02, "UsersRound")
export const Video = /*#__PURE__*/ icon(K.VideoRecorder, "Video")
export const VolumeX = /*#__PURE__*/ icon(K.VolumeX, "VolumeX")
export const Wallet = /*#__PURE__*/ icon(K.Wallet02, "Wallet")
export const WandSparkles = /*#__PURE__*/ icon(K.MagicWand01, "WandSparkles")
export const WifiOff = /*#__PURE__*/ icon(K.WifiOff, "WifiOff")
export const Workflow = /*#__PURE__*/ icon(K.Dataflow03, "Workflow")
export const X = /*#__PURE__*/ icon(C.X, "X")
export const XCircle = /*#__PURE__*/ icon(K.XSquare, "XCircle")
