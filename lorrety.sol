// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    struct NguoiChoi {
        string ma;
        string ten;
        address diaChi;
        uint256[] cacSo;
    }

    struct Ticket {
        string ten;
        address diaChi;
        uint8 so;
    }

    struct WinnerInfo {
        address diaChi;
        string ten;
        string ma;
        uint8 so;
        uint256 prize;
        uint256 ticketIndex;
    }

    address public quanLy;
    uint256 public ticketPrice;
    uint256 public currentRoundId;
    uint256 public maxTicketsPerRound;
    bool public paused;
    bool public daQuay;
    uint8 public soTrung;
    bool private locked;

    mapping(uint256 => Ticket[]) private ticketsByRound;
    mapping(uint256 => mapping(address => uint256[])) private playerTicketsByRound;
    mapping(uint256 => mapping(uint8 => uint256[])) private ticketIndexesByNumber;
    mapping(uint256 => WinnerInfo) private winnersByRound;
    mapping(uint256 => uint256) public prizePoolByRound;
    mapping(uint256 => bool) public prizeClaimedByRound;
    mapping(uint256 => uint256) public roundStartedAtByRound;
    mapping(uint256 => uint256) public roundDrawnAtByRound;

    event TicketBought(
        uint256 indexed roundId,
        address indexed player,
        string name,
        uint8 number,
        uint256 ticketIndex,
        uint256 price
    );
    event LotteryDrawn(
        uint256 indexed roundId,
        uint8 winningNumber,
        address indexed winner,
        string winnerName,
        uint256 prize
    );
    event PrizeClaimed(uint256 indexed roundId, address indexed winner, uint256 amount);
    event RoundReset(uint256 indexed oldRoundId, uint256 indexed newRoundId, uint256 rolloverAmount);
    event TicketPriceChanged(uint256 oldPrice, uint256 newPrice);
    event MaxTicketsChanged(uint256 oldLimit, uint256 newLimit);
    event ManagerChanged(address indexed oldManager, address indexed newManager);
    event ContractPaused(address indexed manager);
    event ContractUnpaused(address indexed manager);

    modifier chiQuanLy() {
        require(msg.sender == quanLy, "Chi quan ly");
        _;
    }

    modifier khiKhongTamDung() {
        require(!paused, "Hop dong dang tam dung");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Dang xu ly giao dich");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        quanLy = msg.sender;
        ticketPrice = 0.01 ether;
        currentRoundId = 1;
        maxTicketsPerRound = 100;
        roundStartedAtByRound[currentRoundId] = block.timestamp;
    }

    function muaVe(string calldata ten, uint256 so) external payable khiKhongTamDung {
        require(!daQuay, "Da quay roi");
        require(bytes(ten).length > 0, "Ten khong duoc rong");
        require(so < 100, "So tu 0-99");
        require(msg.value == ticketPrice, "Sai gia ve");
        require(ticketsByRound[currentRoundId].length < maxTicketsPerRound, "Vong da het ve");

        uint256 ticketIndex = ticketsByRound[currentRoundId].length;
        ticketsByRound[currentRoundId].push(
            Ticket({
                ten: ten,
                diaChi: msg.sender,
                so: uint8(so)
            })
        );

        playerTicketsByRound[currentRoundId][msg.sender].push(ticketIndex);
        ticketIndexesByNumber[currentRoundId][uint8(so)].push(ticketIndex);
        prizePoolByRound[currentRoundId] += msg.value;

        emit TicketBought(currentRoundId, msg.sender, ten, uint8(so), ticketIndex, msg.value);
    }

    function quayXoSo() external chiQuanLy khiKhongTamDung {
        uint8 randomNumber = uint8(_pseudoRandom() % 100);
        _draw(randomNumber);
    }

    function quayXoSoTheoSo(uint256 soChon) external chiQuanLy khiKhongTamDung {
        require(soChon < 100, "So tu 0-99");
        _draw(uint8(soChon));
    }

    function claimPrize(uint256 roundId) external nonReentrant {
        WinnerInfo memory winner = winnersByRound[roundId];
        require(winner.diaChi != address(0), "Khong co nguoi thang");
        require(msg.sender == winner.diaChi, "Khong phai nguoi thang");
        require(!prizeClaimedByRound[roundId], "Da nhan thuong");

        prizeClaimedByRound[roundId] = true;
        prizePoolByRound[roundId] = 0;

        (bool success, ) = payable(msg.sender).call{value: winner.prize}("");
        require(success, "Chuyen thuong that bai");

        emit PrizeClaimed(roundId, msg.sender, winner.prize);
    }

    function resetXoSo() external chiQuanLy khiKhongTamDung {
        uint256 oldRoundId = currentRoundId;
        uint256 rolloverAmount = 0;

        require(daQuay || ticketsByRound[oldRoundId].length == 0, "Chua quay");

        if (daQuay && winnersByRound[oldRoundId].diaChi == address(0)) {
            rolloverAmount = prizePoolByRound[oldRoundId];
            prizePoolByRound[oldRoundId] = 0;
        }

        currentRoundId += 1;
        daQuay = false;
        soTrung = 0;
        roundStartedAtByRound[currentRoundId] = block.timestamp;

        if (rolloverAmount > 0) {
            prizePoolByRound[currentRoundId] = rolloverAmount;
        }

        emit RoundReset(oldRoundId, currentRoundId, rolloverAmount);
    }

    function setTicketPrice(uint256 newTicketPrice) external chiQuanLy khiKhongTamDung {
        require(!daQuay, "Da quay roi");
        require(ticketsByRound[currentRoundId].length == 0, "Vong da co ve");
        require(newTicketPrice > 0, "Gia ve phai lon hon 0");

        uint256 oldPrice = ticketPrice;
        ticketPrice = newTicketPrice;

        emit TicketPriceChanged(oldPrice, newTicketPrice);
    }

    function setMaxTicketsPerRound(uint256 newLimit) external chiQuanLy khiKhongTamDung {
        require(ticketsByRound[currentRoundId].length == 0, "Vong da co ve");
        require(newLimit > 0, "Gioi han phai lon hon 0");

        uint256 oldLimit = maxTicketsPerRound;
        maxTicketsPerRound = newLimit;

        emit MaxTicketsChanged(oldLimit, newLimit);
    }

    function transferQuanLy(address newManager) external chiQuanLy {
        require(newManager != address(0), "Dia chi khong hop le");
        address oldManager = quanLy;
        quanLy = newManager;

        emit ManagerChanged(oldManager, newManager);
    }

    function pauseContract() external chiQuanLy {
        require(!paused, "Da tam dung");
        paused = true;

        emit ContractPaused(msg.sender);
    }

    function unpauseContract() external chiQuanLy {
        require(paused, "Chua tam dung");
        paused = false;

        emit ContractUnpaused(msg.sender);
    }

    function getCurrentRoundInfo()
        external
        view
        returns (
            uint256 roundId,
            bool isPaused,
            bool isDrawn,
            uint8 winningNumber,
            uint256 ticketCount,
            uint256 ticketLimit,
            uint256 prizePool,
            uint256 price,
            address manager,
            address winner,
            string memory winnerName,
            bool prizeClaimed,
            uint256 startedAt,
            uint256 drawnAt
        )
    {
        WinnerInfo memory winnerInfo = winnersByRound[currentRoundId];

        return (
            currentRoundId,
            paused,
            daQuay,
            soTrung,
            ticketsByRound[currentRoundId].length,
            maxTicketsPerRound,
            prizePoolByRound[currentRoundId],
            ticketPrice,
            quanLy,
            winnerInfo.diaChi,
            winnerInfo.ten,
            prizeClaimedByRound[currentRoundId],
            roundStartedAtByRound[currentRoundId],
            roundDrawnAtByRound[currentRoundId]
        );
    }

    function getRoundInfo(uint256 roundId)
        external
        view
        returns (
            uint256 ticketCount,
            uint256 prizePool,
            address winner,
            string memory winnerName,
            string memory winnerCode,
            uint8 winningNumber,
            bool prizeClaimed,
            uint256 startedAt,
            uint256 drawnAt
        )
    {
        WinnerInfo memory winnerInfo = winnersByRound[roundId];

        return (
            ticketsByRound[roundId].length,
            prizePoolByRound[roundId],
            winnerInfo.diaChi,
            winnerInfo.ten,
            winnerInfo.ma,
            winnerInfo.so,
            prizeClaimedByRound[roundId],
            roundStartedAtByRound[roundId],
            roundDrawnAtByRound[roundId]
        );
    }

    function xemDanhSachNguoiChoi() external view returns (NguoiChoi[] memory) {
        Ticket[] storage tickets = ticketsByRound[currentRoundId];
        NguoiChoi[] memory result = new NguoiChoi[](tickets.length);

        for (uint256 i = 0; i < tickets.length; i++) {
            uint256[] memory cacSo = new uint256[](1);
            cacSo[0] = tickets[i].so;

            result[i] = NguoiChoi({
                ma: _playerCode(tickets[i].ten, tickets[i].diaChi, i),
                ten: tickets[i].ten,
                diaChi: tickets[i].diaChi,
                cacSo: cacSo
            });
        }

        return result;
    }

    function xemNguoiThang() external view returns (address, string memory, string memory) {
        WinnerInfo memory winner = winnersByRound[currentRoundId];
        return (winner.diaChi, winner.ten, winner.ma);
    }

    function soNguoiChoi() external view returns (uint256) {
        return ticketsByRound[currentRoundId].length;
    }

    function soNguoiMua(uint256 so) external view returns (string[] memory) {
        require(so < 100, "So tu 0-99");
        uint256[] storage indexes = ticketIndexesByNumber[currentRoundId][uint8(so)];
        string[] memory result = new string[](indexes.length);

        for (uint256 i = 0; i < indexes.length; i++) {
            Ticket storage ticket = ticketsByRound[currentRoundId][indexes[i]];
            result[i] = _playerCode(ticket.ten, ticket.diaChi, indexes[i]);
        }

        return result;
    }

    function layMaNguoiChoi(uint256 index) external view returns (string memory) {
        require(index < ticketsByRound[currentRoundId].length, "Index khong hop le");
        Ticket storage ticket = ticketsByRound[currentRoundId][index];
        return _playerCode(ticket.ten, ticket.diaChi, index);
    }

    function quanLyHienTai() external view returns (address) {
        return quanLy;
    }

    function maNguoiThang() external view returns (string memory) {
        return winnersByRound[currentRoundId].ma;
    }

    function tenNguoiThang() external view returns (string memory) {
        return winnersByRound[currentRoundId].ten;
    }

    function diaChiNguoiThang() external view returns (address) {
        return winnersByRound[currentRoundId].diaChi;
    }

    function tongVeHienTai() external view returns (uint256) {
        return ticketsByRound[currentRoundId].length;
    }

    function giaiThuongHienTai() external view returns (uint256) {
        return prizePoolByRound[currentRoundId];
    }

    function _draw(uint8 winningNumber) private {
        require(!daQuay, "Da quay roi");
        require(ticketsByRound[currentRoundId].length > 0, "Chua co ve");

        daQuay = true;
        soTrung = winningNumber;
        roundDrawnAtByRound[currentRoundId] = block.timestamp;

        uint256[] storage matchedTickets = ticketIndexesByNumber[currentRoundId][winningNumber];
        address winnerAddress = address(0);
        string memory winnerName = "";
        uint256 prize = prizePoolByRound[currentRoundId];

        if (matchedTickets.length > 0) {
            uint256 winnerOffset = _pseudoRandom() % matchedTickets.length;
            uint256 ticketIndex = matchedTickets[winnerOffset];
            Ticket storage winningTicket = ticketsByRound[currentRoundId][ticketIndex];

            winnerAddress = winningTicket.diaChi;
            winnerName = winningTicket.ten;

            winnersByRound[currentRoundId] = WinnerInfo({
                diaChi: winnerAddress,
                ten: winnerName,
                ma: _playerCode(winningTicket.ten, winningTicket.diaChi, ticketIndex),
                so: winningNumber,
                prize: prize,
                ticketIndex: ticketIndex
            });
        }

        emit LotteryDrawn(currentRoundId, winningNumber, winnerAddress, winnerName, prize);
    }

    function _pseudoRandom() private view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    blockhash(block.number - 1),
                    msg.sender,
                    ticketsByRound[currentRoundId].length,
                    prizePoolByRound[currentRoundId]
                )
            )
        );
    }

    function _playerCode(
        string memory ten,
        address diaChi,
        uint256 ticketIndex
    ) private pure returns (string memory) {
        return string(abi.encodePacked(ten, "_", _toAsciiString(diaChi), "_", _uintToString(ticketIndex)));
    }

    function _toAsciiString(address x) private pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = "0";
        s[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2 ** (8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 + 2 * i] = _char(hi);
            s[3 + 2 * i] = _char(lo);
        }

        return string(s);
    }

    function _char(bytes1 b) private pure returns (bytes1 c) {
        if (uint8(b) < 10) {
            return bytes1(uint8(b) + 0x30);
        }

        return bytes1(uint8(b) + 0x57);
    }

    function _uintToString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);

        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }
}
